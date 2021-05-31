import ts from 'typescript';
// eslint-disable-next-line import/no-unresolved
import { INT_TYPE_NAME } from '@olm/ts-codegen-basic-type';
import {
  Field,
  ValueType,
  BasicTypeValue,
  CustomType,
  ArrayType,
  BasicType,
  ValueTypeKindFlag,
  EnumType,
  EnumSubType,
  NonEmptyType,
  isOptionalType,
  DictionaryType,
  DictionaryKeyType,
  isCustomType,
} from '../types';
import { extractUnionTypeNode } from './utils';

export class ValueParser {
  constructor(
    private checker: ts.TypeChecker,
  ) {}

  parseFunctionReturnType(
    methodSignature: ts.MethodSignature,
  ): ValueType | null {
    if (methodSignature.type?.kind === ts.SyntaxKind.VoidKeyword) {
      return null;
    }

    return this.valueTypeFromNode(methodSignature);
  }

  parseFunctionParameterType(typeNode: ts.TypeNode): Field[] {
    const typeLiteralType = this.parseTypeLiteralNode(typeNode);
    if (typeLiteralType !== null && isCustomType(typeLiteralType)) {
      return typeLiteralType.members;
    }

    const referenceType = this.parseReferenceTypeNode(typeNode);
    if (referenceType !== null && isCustomType(referenceType)) {
      return referenceType.members;
    }

    throw Error('Not supported parameter type');
  }

  private parseTypeLiteralNode(typeNode: ts.TypeNode): CustomType | DictionaryType | null {
    if (!ts.isTypeLiteralNode(typeNode)) {
      return null;
    }

    const dictionaryType = this.parseIndexTypeNode(typeNode);
    if (dictionaryType) {
      return dictionaryType;
    }

    const fields = typeNode.members
      .map(member => this.fieldFromTypeElement(member))
      .filter((field): field is Field => field !== null);

    return {
      flag: ValueTypeKindFlag.customType,
      members: fields,
    };
  }

  private valueTypeFromNode(
    node: ts.Node & { type?: ts.TypeNode; questionToken?: ts.QuestionToken },
  ): ValueType {
    if (node.type === undefined) {
      throw Error('Invalid type');
    }

    const nullable = node.questionToken !== undefined;
    const valueType = this.valueTypeFromTypeNode(node.type);

    if (nullable && !isOptionalType(valueType)) {
      return {
        flag: ValueTypeKindFlag.optionalType,
        type: valueType,
      };
    }

    return valueType;
  }

  private valueTypeFromTypeNode(
    typeNode: ts.TypeNode,
  ): ValueType {
    const unionType = this.parseUnionTypeNode(typeNode);
    if (unionType !== null) {
      return unionType;
    }

    const referenceType = this.parseReferenceTypeNode(typeNode);
    if (referenceType !== null) {
      return referenceType;
    }

    return this.nonEmptyTypeFromTypeNode(typeNode);
  }

  private nonEmptyTypeFromTypeNode(
    typeNode: ts.TypeNode,
  ): NonEmptyType {
    const typeKind = this.basicTypeKindFromTypeNode(typeNode);
    if (typeKind !== null) {
      return typeKind;
    }

    const typeLiteralType = this.parseTypeLiteralNode(typeNode);
    if (typeLiteralType !== null) {
      return typeLiteralType;
    }

    const arrayTypeKind = this.arrayTypeKindFromTypeNode(typeNode);
    if (arrayTypeKind !== null) {
      return arrayTypeKind;
    }

    throw Error('invalid type');
  }

  private parseUnionTypeNode(node: ts.TypeNode): ValueType | null {
    if (!ts.isUnionTypeNode(node)) {
      return null;
    }

    const { typeNode, nullable } = extractUnionTypeNode(node);
    const valueType = this.valueTypeFromTypeNode(typeNode);

    if (!isOptionalType(valueType) && nullable) {
      return {
        flag: ValueTypeKindFlag.optionalType,
        type: valueType,
      };
    }

    return valueType;
  }

  private basicTypeKindFromTypeNode(node: ts.TypeNode): BasicType | null {
    if (node.kind === ts.SyntaxKind.StringKeyword) {
      return {
        flag: ValueTypeKindFlag.basicType,
        value: BasicTypeValue.string,
      };
    }
    if (node.kind === ts.SyntaxKind.NumberKeyword) {
      return {
        flag: ValueTypeKindFlag.basicType,
        value: BasicTypeValue.number,
      };
    }
    if (node.kind === ts.SyntaxKind.BooleanKeyword) {
      return {
        flag: ValueTypeKindFlag.basicType,
        value: BasicTypeValue.boolean,
      };
    }

    return null;
  }

  private parseReferenceTypeNode(node: ts.TypeNode): ValueType | null {
    if (!ts.isTypeReferenceNode(node)) {
      return null;
    }

    const typeName = node.typeName.getText();
    const aliasType = this.getAliasType(typeName);
    if (aliasType) {
      return aliasType;
    }

    let symbol = this.checker.getSymbolAtLocation(node.typeName);
    if (!symbol) {
      throw Error('Invalid reference type');
    }

    if (symbol.flags & ts.SymbolFlags.Alias) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }

    const declarations = symbol.getDeclarations();
    if (declarations === undefined || declarations.length !== 1) {
      throw Error('Invalid declaration');
    }
    const declaration = declarations[0];

    const interfaceType = this.parseInterfaceType(declaration);
    if (interfaceType !== null) {
      return interfaceType;
    }

    const enumTypeKind = this.enumTypeKindFromType(declaration);
    if (enumTypeKind !== null) {
      return enumTypeKind;
    }

    return this.valueTypeFromNode(declaration);
  }

  private arrayTypeKindFromTypeNode(node: ts.TypeNode): ArrayType | null {
    if (!ts.isArrayTypeNode(node)) {
      return null;
    }

    const elementType = this.valueTypeFromTypeNode(node.elementType);
    if (elementType) {
      return {
        flag: ValueTypeKindFlag.arrayType,
        elementType,
      };
    }

    return null;
  }

  private getAliasType(typeName: string): BasicType | null {
    if (typeName === INT_TYPE_NAME) {
      return {
        flag: ValueTypeKindFlag.basicType,
        value: BasicTypeValue.int,
      };
    }
    return null;
  }

  private parseInterfaceType(node: ts.Node): CustomType | DictionaryType | null {
    if (!ts.isInterfaceDeclaration(node)) {
      return null;
    }

    const indexType = this.parseIndexTypeNode(node);
    if (indexType) {
      return indexType;
    }

    const name = node.name.getText();

    const members = node.members
      .map(item => this.fieldFromTypeElement(item))
      .filter((field): field is Field => field !== null);

    const membersInExtendingInterface = this.getExtendingMembersFromInterfaceDeclaration(node);
    if (membersInExtendingInterface.length) {
      members.push(...membersInExtendingInterface);
    }

    return {
      flag: ValueTypeKindFlag.customType,
      name,
      members,
    };
  }

  private enumTypeKindFromType(node: ts.Node): EnumType | null {
    if (!ts.isEnumDeclaration(node)) {
      return null;
    }

    const name = node.name.getText();
    let enumSubType: EnumSubType = EnumSubType.string;
    const keys: string[] = [];
    const values: (string | number)[] = [];
    let hasMultipleSubType = false;

    node.members.forEach((enumMember, index) => {
      if (hasMultipleSubType) {
        return;
      }
      const key = enumMember.name.getText();
      let value: string | number = key;
      const subType = ((): EnumSubType => {
        if (enumMember.initializer) {
          const valueInitializer = enumMember.initializer;
          if (ts.isStringLiteral(valueInitializer)) {
            value = valueInitializer.text;
            return EnumSubType.string;
          }
          if (ts.isNumericLiteral(valueInitializer)) {
            value = Number(valueInitializer.text);
            return EnumSubType.number;
          }
        }
        return EnumSubType.string;
      })();
      if (index > 0 && enumSubType !== subType) {
        hasMultipleSubType = true;
        return;
      }

      enumSubType = subType;
      keys.push(key);
      values.push(value);
    });

    if (hasMultipleSubType) {
      throw new Error("Enum doesn't support multiple sub types");
    }

    return {
      flag: ValueTypeKindFlag.enumType,
      name,
      subType: enumSubType,
      keys,
      values,
    };
  }

  private parseIndexTypeNode(
    type: { members: ts.NodeArray<ts.TypeElement> },
  ): DictionaryType | null {
    if (type.members && type.members.length !== 1) {
      // Only support interface with one index signature, like { [key: string]: string }
      return null;
    }

    const typeElement = type.members[0];
    if (!ts.isIndexSignatureDeclaration(typeElement)) {
      return null;
    }

    const valueType = this.valueTypeFromNode(typeElement);

    return {
      flag: ValueTypeKindFlag.dictionaryType,
      keyType: DictionaryKeyType.string,
      valueType,
    };
  }

  private fieldFromTypeElement(node: ts.TypeElement): Field | null {
    if (!ts.isPropertySignature(node)) {
      return null;
    }

    const name = node.name.getText();
    const valueType = this.valueTypeFromNode(node);

    return {
      name,
      type: valueType,
    };
  }

  private getExtendingMembersFromInterfaceDeclaration(node: ts.InterfaceDeclaration): Field[] {
    if (!node.heritageClauses?.length) {
      return [];
    }
    const extendHeritageClause = node.heritageClauses.find((item) => item.token === ts.SyntaxKind.ExtendsKeyword);
    if (!extendHeritageClause) {
      return [];
    }

    return extendHeritageClause.types.flatMap((extendingInterface): Field[] => {
      const type = this.checker.getTypeAtLocation(extendingInterface);
      const declarations = type.symbol.getDeclarations();
      if (declarations === undefined || declarations.length !== 1) {
        throw Error('Invalid decration');
      }
      const declaration = declarations[0];
      const interfaceType = this.parseInterfaceType(declaration);

      if (interfaceType === null) {
        return [];
      }
      if (!isCustomType(interfaceType)) {
        throw Error('Invalid extended type');
      }

      return interfaceType.members;
    });
  }
}
