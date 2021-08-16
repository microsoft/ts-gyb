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
  EnumField,
  isDictionaryType,
  isBasicType,
} from '../types';
import { isUndefinedOrNull, parseTypeJSDocTags } from './utils';
import { ValueParserError } from './ValueParserError';

export class ValueParser {
  constructor(private readonly checker: ts.TypeChecker, private readonly predefinedTypes: Set<string>) {}

  parseFunctionReturnType(methodSignature: ts.SignatureDeclarationBase): [ValueType | null, boolean] {
    if (methodSignature.type === undefined) {
      throw new ValueParserError(
        'no return type provided',
        "Use void to explicity specify the method doesn't return a value"
      );
    }

    if (methodSignature.type.kind === ts.SyntaxKind.VoidKeyword) {
      return [null, false];
    }

    // Handle promise
    if (ts.isTypeReferenceNode(methodSignature.type) && methodSignature.type.typeName.getText() === 'Promise') {
      if (methodSignature.type.typeArguments === undefined || methodSignature.type.typeArguments.length !== 1) {
        throw Error('Invalid promise');
      }
      const wrappedTypeNode = methodSignature.type.typeArguments[0];

      if (wrappedTypeNode.kind === ts.SyntaxKind.VoidKeyword) {
        return [null, true];
      }

      return [this.valueTypeFromTypeNode(wrappedTypeNode), true];
    }

    return [this.valueTypeFromTypeNode(methodSignature.type), false];
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

    throw new ValueParserError(
      `parameters type ${typeNode.getText()} is not supported`,
      'Only object literal and interface are supported'
    );
  }

  fieldFromTypeElement(node: ts.TypeElement): Field | null {
    if (!ts.isPropertySignature(node)) {
      return null;
    }

    if (!node.type) {
      throw Error(`Type ${node.name.getText()} is invalid`);
    }

    const name = node.name.getText();

    const symbol = this.checker.getSymbolAtLocation(node.name);
    const documentation = ts.displayPartsToString(symbol?.getDocumentationComment(this.checker));

    const staticValue = this.parseLiteralNode(node.type);
    if (staticValue !== null) {
      return { name, type: staticValue.type, staticValue: staticValue.value, documentation };
    }

    const valueType = this.valueTypeFromNode(node);

    return {
      name,
      type: valueType,
      documentation,
    };
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
      throw Error(`type ${node.getText()} is invalid`);
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

    const arrayType = this.arrayTypeKindFromTypeNode(typeNode);
    if (arrayType !== null) {
      return arrayType;
    }

    throw new ValueParserError(
      `type ${typeNode.getText()} is not supported`,
      'Supproted types are: string, number, boolean, array, dictionary, object, interface and enum'
    );
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
        throw new ValueParserError(
          `union type ${node.getText()} is invalid`,
          'Do not support multiple union types except for interface or literal type'
        );
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
      throw new ValueParserError(
        `union type ${node.getText()} is invalid`,
        'Union type must contain one supported non empty type'
      );
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

    const arrayType = this.parseArraryReferenceNode(node);
    if (arrayType !== null) {
      return arrayType;
    }

    const dictionaryType = this.parseRecordAndMapReferenceNode(node);
    if (dictionaryType !== null) {
      return dictionaryType;
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

    const symbol = this.checker.getSymbolAtLocation(node.typeName);
    if (symbol === undefined) {
      throw Error(`Reference type ${typeName} is invalid`);
    }

    const documentation = ts.displayPartsToString(symbol.getDocumentationComment(this.checker));
    const jsDocTagsResult = parseTypeJSDocTags(symbol);

    const customType = {
      name: jsDocTagsResult.overrideName ?? typeName,
      documentation,
      customTags: jsDocTagsResult.customTags,
    };

    if (isTupleType(valueType)) {
      valueType = {
        kind: ValueTypeKind.interfaceType,
        members: valueType.members,
        ...customType,
      };
    } else if (isOptionalType(valueType) && isTupleType(valueType.wrappedType)) {
      valueType.wrappedType = {
        kind: ValueTypeKind.interfaceType,
        members: valueType.wrappedType.members,
        ...customType,
      };
    }

    return valueType;
  }

  private parseArraryReferenceNode(referenceNode: ts.TypeReferenceNode): ArrayType | null {
    if (referenceNode.typeName.getText() !== 'Array') {
      return null;
    }
    if (referenceNode.typeArguments === undefined || referenceNode.typeArguments.length !== 1) {
      return null;
    }

    const elementType = this.valueTypeFromTypeNode(referenceNode.typeArguments[0]);

    return {
      kind: ValueTypeKind.arrayType,
      elementType,
    };
  }

  private parseRecordAndMapReferenceNode(referenceNode: ts.TypeReferenceNode): DictionaryType | null {
    const typeName = referenceNode.typeName.getText();
    if (typeName !== 'Record' && typeName !== 'Map') {
      return null;
    }
    if (referenceNode.typeArguments === undefined || referenceNode.typeArguments.length !== 2) {
      return null;
    }

    return this.dictionaryTypeFromTypeNodes(referenceNode.typeArguments[0], referenceNode.typeArguments[1]);
  }

  private getReferencedTypeNode(referenceNode: ts.TypeReferenceNode): ts.Declaration {
    let symbol = this.checker.getSymbolAtLocation(referenceNode.typeName);
    if (!symbol) {
      throw new ValueParserError(
        `reference type ${referenceNode.getText()} not found`,
        'Make sure it is property imported or the file where the type is defined is included in search paths.'
      );
    }

    if (symbol.flags & ts.SymbolFlags.Alias) {
      symbol = this.checker.getAliasedSymbol(symbol);
    }

    const declarations = symbol.getDeclarations();
    if (declarations === undefined || declarations.length !== 1) {
      throw Error(`Invalid declaration for reference type ${symbol.name}`);
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

    const symbol = this.checker.getSymbolAtLocation(node.name);
    if (symbol === undefined) {
      throw Error(`Invalid interface type ${name}`);
    }

    const documentation = ts.displayPartsToString(symbol.getDocumentationComment(this.checker));
    const jsDocTagsResult = parseTypeJSDocTags(symbol);

    return {
      kind: ValueTypeKind.interfaceType,
      name: jsDocTagsResult.overrideName ?? name,
      members,
      documentation,
      customTags: jsDocTagsResult.customTags,
    };
  }

  private enumTypeKindFromType(node: ts.Node): EnumType | null {
    if (!ts.isEnumDeclaration(node)) {
      return null;
    }

    const name = node.name.getText();
    let enumSubType: EnumSubType = EnumSubType.string;
    const members: EnumField[] = [];
    let hasMultipleSubType = false;

    node.members.forEach((enumMember, index) => {
      if (hasMultipleSubType) {
        return;
      }
      const key = enumMember.name.getText();
      let value: string | number = index;
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
        return EnumSubType.number;
      })();
      if (index > 0 && enumSubType !== subType) {
        hasMultipleSubType = true;
        return;
      }

      const symbol = this.checker.getSymbolAtLocation(enumMember.name);
      const documentation = ts.displayPartsToString(symbol?.getDocumentationComment(this.checker));

      enumSubType = subType;
      members.push({ key, value, documentation });
    });

    if (hasMultipleSubType) {
      throw new ValueParserError(
        `enum ${name} is invalid because enums with multiple subtypes are not supported.`,
        'Use only either string or number as the value of the enum'
      );
    }

    const symbol = this.checker.getSymbolAtLocation(node.name);
    if (symbol === undefined) {
      throw Error(`Invalid enum type ${name}`);
    }

    const documentation = ts.displayPartsToString(symbol.getDocumentationComment(this.checker));
    const jsDocTagsResult = parseTypeJSDocTags(symbol);

    return {
      kind: ValueTypeKind.enumType,
      name: jsDocTagsResult.overrideName ?? name,
      subType: enumSubType,
      members,
      documentation,
      customTags: jsDocTagsResult.customTags,
    };
  }

  private parseIndexTypeNode(type: ts.Node & { members: ts.NodeArray<ts.TypeElement> }): DictionaryType | null {
    if (type.members && type.members.length !== 1) {
      // Only support interface with one index signature, like { [key: string]: string }
      return null;
    }

    const typeElement = type.members[0];
    if (!ts.isIndexSignatureDeclaration(typeElement)) {
      return null;
    }

    if (typeElement.parameters.length !== 1) {
      throw Error(`Index type ${type.getText()} has none or multiple parameters. It is not a valid dictionary type`);
    }
    const keyNode = typeElement.parameters[0];
    if (keyNode.type === undefined) {
      throw Error(`Index type ${type.getText()} doesn't have type. It is not a valid dictionary type`);
    }

    return this.dictionaryTypeFromTypeNodes(keyNode.type, typeElement.type);
  }

  private dictionaryTypeFromTypeNodes(keyNode: ts.TypeNode, valueNode: ts.TypeNode): DictionaryType {
    const keyType = this.valueTypeFromTypeNode(keyNode);

    if (!isBasicType(keyType)) {
      throw Error(`Key type kind ${keyType.kind} is not supported as key for dictionary`);
    }
    
    let dictKey: DictionaryKeyType;
    if (keyType.value === BasicTypeValue.string) {
      dictKey = DictionaryKeyType.string;
    } else if (keyType.value === BasicTypeValue.number) {
      dictKey = DictionaryKeyType.number;
    } else {
      throw Error(`Key type ${keyType.value} is not supported as key for dictionary`);
    }

    const valueType = this.valueTypeFromTypeNode(valueNode);

    return {
      kind: ValueTypeKind.dictionaryType,
      keyType: dictKey,
      valueType,
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
          value: Number(typeNode.literal.text),
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
      const typeName = typeNode.typeName.getText();
      const predefinedType = this.parsePredefinedType(typeName);
      if (predefinedType) {
        return null;
      }

      let referencedNode: ts.Declaration;
      try {
        referencedNode = this.getReferencedTypeNode(typeNode);
      }
      catch {
        return null;
      }

      if (ts.isEnumMember(referencedNode)) {
        const enumType = this.enumTypeKindFromType(referencedNode.parent);
        if (enumType === null) {
          throw Error(`Invalid enum member ${typeName}`);
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
        throw Error(`Invalid decration of extended interface type ${type.symbol.name}`);
      }
      const declaration = declarations[0];
      const interfaceType = this.parseInterfaceType(declaration);

      if (interfaceType === null) {
        return [];
      }
      if (isDictionaryType(interfaceType)) {
        throw new ValueParserError(
          `cannot extend dictionary type ${type.symbol.name}`,
          'Only extending an interface is supported'
        );
      }

      return interfaceType.members;
    });
  }
}
