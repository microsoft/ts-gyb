import ts from 'typescript';
import {
  Field,
  ValueType,
  BasicTypeValue,
  InterfaceType,
  ArrayType,
  BasicType,
  ValueTypeKind,
  EnumType,
  EnumSubType,
  NonEmptyType,
  isOptionalType,
  DictionaryType,
  DictionaryKeyType,
  isInterfaceType,
  PredefinedType,
  Value,
  TupleType,
  isTupleType,
} from '../types';
import { isUndefinedOrNull } from './utils';

export class ValueParser {
  constructor(private readonly checker: ts.TypeChecker, private readonly predefinedTypes: Set<string>) {}

  parseFunctionReturnType(methodSignature: ts.MethodSignature): ValueType | null {
    if (methodSignature.type?.kind === ts.SyntaxKind.VoidKeyword) {
      return null;
    }

    if (
      methodSignature.type !== undefined &&
      ts.isTypeReferenceNode(methodSignature.type) &&
      methodSignature.type.typeName.getText() === 'Promise'
    ) {
      if (methodSignature.type.typeArguments === undefined || methodSignature.type.typeArguments.length !== 1) {
        throw Error('Invalid promise');
      }
      const wrappedTypeNode = methodSignature.type.typeArguments[0];

      if (wrappedTypeNode.kind === ts.SyntaxKind.VoidKeyword) {
        return null;
      }

      return this.valueTypeFromTypeNode(wrappedTypeNode);
    }

    return this.valueTypeFromNode(methodSignature);
  }

  parseFunctionParameterType(typeNode: ts.TypeNode): Field[] {
    const typeLiteralType = this.parseTypeLiteralNode(typeNode);
    if (typeLiteralType !== null && isTupleType(typeLiteralType)) {
      return typeLiteralType.members;
    }

    const referenceType = this.parseReferenceTypeNode(typeNode);
    if (referenceType !== null && (isInterfaceType(referenceType) || isTupleType(referenceType))) {
      return referenceType.members;
    }

    throw Error('Not supported parameter type');
  }

  private parseTypeLiteralNode(typeNode: ts.TypeNode): TupleType | DictionaryType | null {
    if (!ts.isTypeLiteralNode(typeNode)) {
      return null;
    }

    const dictionaryType = this.parseIndexTypeNode(typeNode);
    if (dictionaryType) {
      return dictionaryType;
    }

    const fields = typeNode.members
      .map((member) => this.fieldFromTypeElement(member))
      .filter((field): field is Field => field !== null);

    return {
      kind: ValueTypeKind.tupleType,
      members: fields,
    };
  }

  private valueTypeFromNode(node: ts.Node & { type?: ts.TypeNode; questionToken?: ts.QuestionToken }): ValueType {
    if (node.type === undefined) {
      throw Error('Invalid type');
    }

    const nullable = node.questionToken !== undefined;
    const valueType = this.valueTypeFromTypeNode(node.type);

    if (nullable && !isOptionalType(valueType)) {
      return {
        kind: ValueTypeKind.optionalType,
        wrappedType: valueType,
      };
    }

    return valueType;
  }

  private valueTypeFromTypeNode(typeNode: ts.TypeNode): ValueType {
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

  private nonEmptyTypeFromTypeNode(typeNode: ts.TypeNode): NonEmptyType {
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

    let nullable = false;
    let valueType: ValueType | undefined;

    node.types.forEach((typeNode) => {
      if (isUndefinedOrNull(typeNode)) {
        nullable = true;
        return;
      }

      const newValueType = this.valueTypeFromTypeNode(typeNode);

      if (!valueType) {
        valueType = newValueType;
        return;
      }

      if (
        (!isInterfaceType(valueType) && !isTupleType(valueType)) ||
        (!isInterfaceType(newValueType) && !isTupleType(newValueType))
      ) {
        throw Error('Do not support multiple union types except for interface or literal type.');
      }

      const existingMemberNames = new Set(valueType.members.map((member) => member.name));
      valueType = {
        kind: ValueTypeKind.tupleType,
        members: valueType.members.concat(
          newValueType.members.filter((member) => !existingMemberNames.has(member.name))
        ),
      };
    });

    if (!valueType) {
      throw Error('Invald union type');
    }

    if (!isOptionalType(valueType) && nullable) {
      return {
        kind: ValueTypeKind.optionalType,
        wrappedType: valueType,
      };
    }

    return valueType;
  }

  private basicTypeKindFromTypeNode(node: ts.TypeNode): BasicType | null {
    if (node.kind === ts.SyntaxKind.StringKeyword) {
      return {
        kind: ValueTypeKind.basicType,
        value: BasicTypeValue.string,
      };
    }
    if (node.kind === ts.SyntaxKind.NumberKeyword) {
      return {
        kind: ValueTypeKind.basicType,
        value: BasicTypeValue.number,
      };
    }
    if (node.kind === ts.SyntaxKind.BooleanKeyword) {
      return {
        kind: ValueTypeKind.basicType,
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
    const predefinedType = this.parsePredefinedType(typeName);
    if (predefinedType) {
      return predefinedType;
    }

    const declaration = this.getReferencedTypeNode(node);

    const interfaceType = this.parseInterfaceType(declaration);
    if (interfaceType !== null) {
      return interfaceType;
    }

    const enumTypeKind = this.enumTypeKindFromType(declaration);
    if (enumTypeKind !== null) {
      return enumTypeKind;
    }

    let valueType = this.valueTypeFromNode(declaration);

    if (isTupleType(valueType)) {
      valueType = {
        kind: ValueTypeKind.interfaceType,
        name: typeName,
        members: valueType.members,
      };
    } else if (isOptionalType(valueType) && isTupleType(valueType.wrappedType)) {
      valueType.wrappedType = {
        kind: ValueTypeKind.interfaceType,
        name: typeName,
        members: valueType.wrappedType.members,
      };
    }

    return valueType;
  }

  private getReferencedTypeNode(referenceNode: ts.TypeReferenceNode): ts.Declaration {
    let symbol = this.checker.getSymbolAtLocation(referenceNode.typeName);
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

    return declarations[0];
  }

  private arrayTypeKindFromTypeNode(node: ts.TypeNode): ArrayType | null {
    if (!ts.isArrayTypeNode(node)) {
      return null;
    }

    const elementType = this.valueTypeFromTypeNode(node.elementType);
    if (elementType) {
      return {
        kind: ValueTypeKind.arrayType,
        elementType,
      };
    }

    return null;
  }

  private parsePredefinedType(typeName: string): PredefinedType | null {
    if (this.predefinedTypes.has(typeName)) {
      return {
        kind: ValueTypeKind.predefinedType,
        name: typeName,
      };
    }
    return null;
  }

  private parseInterfaceType(node: ts.Node): InterfaceType | DictionaryType | null {
    if (!ts.isInterfaceDeclaration(node)) {
      return null;
    }

    const indexType = this.parseIndexTypeNode(node);
    if (indexType) {
      return indexType;
    }

    const name = node.name.getText();

    const members = node.members
      .map((item) => this.fieldFromTypeElement(item))
      .filter((field): field is Field => field !== null);

    const membersInExtendingInterface = this.getExtendingMembersFromInterfaceDeclaration(node);
    if (membersInExtendingInterface.length) {
      members.push(...membersInExtendingInterface);
    }

    return {
      kind: ValueTypeKind.interfaceType,
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
    const members: Record<string, string | number> = {};
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
      members[key] = value;
    });

    if (hasMultipleSubType) {
      throw new Error("Enum doesn't support multiple sub types");
    }

    return {
      kind: ValueTypeKind.enumType,
      name,
      subType: enumSubType,
      members,
    };
  }

  private parseIndexTypeNode(type: { members: ts.NodeArray<ts.TypeElement> }): DictionaryType | null {
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
      kind: ValueTypeKind.dictionaryType,
      keyType: DictionaryKeyType.string,
      valueType,
    };
  }

  private fieldFromTypeElement(node: ts.TypeElement): Field | null {
    if (!ts.isPropertySignature(node)) {
      return null;
    }

    if (!node.type) {
      throw Error('Invalid type');
    }

    const name = node.name.getText();

    const staticValue = this.parseLiteralNode(node.type);
    if (staticValue !== null) {
      return { name, type: staticValue.type, staticValue: staticValue.value };
    }

    const valueType = this.valueTypeFromNode(node);

    return {
      name,
      type: valueType,
    };
  }

  private parseLiteralNode(typeNode: ts.TypeNode): { type: ValueType; value: Value } | null {
    if (ts.isLiteralTypeNode(typeNode)) {
      if (ts.isNumericLiteral(typeNode.literal)) {
        return {
          type: {
            kind: ValueTypeKind.basicType,
            value: BasicTypeValue.number,
          },
          value: JSON.parse(typeNode.literal.text) as number,
        };
      }

      if (ts.isStringLiteral(typeNode.literal)) {
        return {
          type: {
            kind: ValueTypeKind.basicType,
            value: BasicTypeValue.string,
          },
          value: typeNode.literal.text,
        };
      }
    }

    if (ts.isTypeReferenceNode(typeNode)) {
      const referencedNode = this.getReferencedTypeNode(typeNode);
      if (ts.isEnumMember(referencedNode)) {
        const enumType = this.enumTypeKindFromType(referencedNode.parent);
        if (enumType === null) {
          throw Error('Invalid enum member');
        }
        return {
          type: enumType,
          value: referencedNode.name.getText(),
        };
      }
    }

    return null;
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
      if (!isInterfaceType(interfaceType)) {
        throw Error('Invalid extended type');
      }

      return interfaceType.members;
    });
  }
}
