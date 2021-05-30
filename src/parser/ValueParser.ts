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
    const typeLiteralFields = this.parseTypeLiteralNode(typeNode);
    if (typeLiteralFields !== null) {
      return typeLiteralFields;
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      const referenceType = this.checker.getTypeFromTypeNode(typeNode);
      const interfaceType = this.getInterfaceMembersAndNameFromType(referenceType);
      if (!interfaceType) {
        return [];
      }

      return interfaceType.members;
    }

    throw Error('Not supported parameter type');
  }

  private parseTypeLiteralNode(typeNode: ts.TypeNode): Field[] | null {
    if (!ts.isTypeLiteralNode(typeNode)) {
      return null;
    }

    return typeNode.members
      .map(member => this.fieldFromTypeElement(member))
      .filter((field): field is Field => field !== null);
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
    const unionTypeInfo = extractUnionTypeNode(typeNode);

    if (unionTypeInfo === null) {
      return this.nonEmptyTypeFromTypeNode(typeNode);
    }

    const valueType = this.nonEmptyTypeFromTypeNode(unionTypeInfo.typeNode);
    
    if (!unionTypeInfo.nullable) {
      return valueType;
    }

    return {
      flag: ValueTypeKindFlag.optionalType,
      type: valueType,
    };
  }

  private nonEmptyTypeFromTypeNode(
    typeNode: ts.TypeNode,
  ): NonEmptyType {
    const typeKind = this.basicTypeKindFromTypeNode(typeNode);
    if (typeKind !== null) {
      return typeKind;
    }

    let customTypeKind = this.referenceTypeKindFromTypeNode(typeNode);
    if (customTypeKind !== null) {
      return customTypeKind;
    }

    customTypeKind = this.literalTypeKindFromTypeNode(typeNode);
    if (customTypeKind !== null) {
      return customTypeKind;
    }

    const arrayTypeKind = this.arrayTypeKindFromTypeNode(typeNode);
    if (arrayTypeKind !== null) {
      return arrayTypeKind;
    }

    throw Error('invalid type');
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

  private referenceTypeKindFromTypeNode(node: ts.TypeNode): CustomType | EnumType | BasicType | null {
    if (!ts.isTypeReferenceNode(node)) {
      return null;
    }

    const referenceType = this.checker.getTypeFromTypeNode(node);

    if (referenceType.aliasSymbol) {
      const aliasTypeKind = this.getAliasType(referenceType.aliasSymbol);
      if (aliasTypeKind) {
        return aliasTypeKind;
      }
    }

    // Basic type alias
    if (!referenceType.symbol) {
      const typeNode = this.checker.typeToTypeNode(referenceType);
      if (typeNode) {
        const basicTypeKind = this.basicTypeKindFromTypeNode(typeNode);
        if (basicTypeKind) {
          return basicTypeKind;
        }
      }
    }

    const { name, members, isAnyKeyDictionary } = this.getInterfaceMembersAndNameFromType(referenceType);
    if (members.length !== 0) {
      return {
        flag: ValueTypeKindFlag.customType,
        name,
        members,
        isAnyKeyDictionary,
      };
    }

    const enumTypeKind = this.enumTypeKindFromType(referenceType);
    if (enumTypeKind) {
      return enumTypeKind;
    }

    return null;
  }

  private literalTypeKindFromTypeNode(node: ts.TypeNode): CustomType | null {
    if (!ts.isTypeLiteralNode(node)) {
      return null;
    }

    const indexField = this.indexFieldFromMembersParent(node);
    if (indexField) {
      return {
        flag: ValueTypeKindFlag.customType,
        members: [indexField],
        isAnyKeyDictionary: true,
      };
    }

    const fields = this.parseTypeLiteralNode(node);
    if (fields) {
      return {
        flag: ValueTypeKindFlag.customType,
        members: fields,
      };
    }

    return null;
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

  private getAliasType(symbol: ts.Symbol): BasicType | null {
    if (symbol.name === INT_TYPE_NAME) {
      return {
        flag: ValueTypeKindFlag.basicType,
        value: BasicTypeValue.int,
      };
    }
    return null;
  }

  private getInterfaceMembersAndNameFromType(type: ts.Type): {
    name: string;
    members: Field[];
    isAnyKeyDictionary: boolean;
  } {
    const result = {
      name: '',
      members: [] as Field[],
      isAnyKeyDictionary: false,
    };
    const declarations = type.symbol.getDeclarations();
    if (declarations === undefined || declarations.length !== 1) {
      return result;
    }

    const interfaceDeclaration = declarations[0];
    if (!ts.isInterfaceDeclaration(interfaceDeclaration)) {
      return result;
    }

    result.name = interfaceDeclaration.name.getText();

    const indexField = this.indexFieldFromMembersParent(interfaceDeclaration);
    if (indexField) {
      result.members = [indexField];
      result.isAnyKeyDictionary = true;
    } else {
      result.members = interfaceDeclaration.members
        .map(item => this.fieldFromTypeElement(item))
        .filter((field): field is Field => field !== null);

      const membersInExtendingInterface = this.getExtendingMembersFromInterfaceDeclaration(interfaceDeclaration);
      if (membersInExtendingInterface.length) {
        result.members.push(...membersInExtendingInterface);
      }
    }

    return result;
  }

  private enumTypeKindFromType(type: ts.Type): EnumType | null {
    const declarations = type.symbol.getDeclarations();
    if (declarations === undefined || declarations.length !== 1) {
      return null;
    }

    const enumDeclaration = declarations[0];
    if (!ts.isEnumDeclaration(enumDeclaration)) {
      return null;
    }

    const name = enumDeclaration.name.getText();
    let enumSubType: EnumSubType = EnumSubType.string;
    const keys: string[] = [];
    const values: (string | number)[] = [];
    let hasMultipleSubType = false;

    enumDeclaration.members.forEach((enumMember, index) => {
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

  private indexFieldFromMembersParent(
    type: { members: ts.NodeArray<ts.TypeElement> },
  ): Field | null {
    if (type.members && type.members.length !== 1) {
      // Only support interface with one index signature, like { [key: string]: string }
      return null;
    }

    const typeElement = type.members[0];
    if (ts.isIndexSignatureDeclaration(typeElement)) {
      const name = typeElement.parameters[0].name.getText();
      const valueType = this.valueTypeFromNode(
        typeElement,
      );

      if (valueType !== null && name) {
        return {
          name,
          type: valueType,
        };
      }
    }

    return null;
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
      const { members, isAnyKeyDictionary } = this.getInterfaceMembersAndNameFromType(type);
      return isAnyKeyDictionary ? [] : members;
    });
  }
}
