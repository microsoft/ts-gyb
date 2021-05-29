import ts from 'typescript';
import { INT_TYPE_NAME } from '@olm/ts-codegen-basic-type';
import { capitalize } from '../utils';
import {
  Field,
  ValueType,
  BasicTypeValue,
  CustomTypeKind,
  ArrayTypeKind,
  BasicTypeKind,
  ValueTypeKindFlag,
  EnumKind,
  EnumSubType,
} from '../types';

export class ValueParser {
  constructor(
    private checker: ts.TypeChecker,
  ) {}

  valueTypeFromNode(
    node: ts.Node & { type?: ts.TypeNode; questionToken?: ts.QuestionToken },
    literalTypeDescription: string,
  ): ValueType | null {
    if (node.type === undefined) {
      return null;
    }

    const nullable = node.questionToken !== undefined;

    return this.valueTypeFromTypeNode(node.type, nullable, literalTypeDescription);
  }

  parseTypeLiteralNode(typeNode: ts.TypeNode, literalTypeDescription: string): Field[] | null {
    if (!ts.isTypeLiteralNode(typeNode)) {
      return null;
    }

    return typeNode.members
      .map((member, index) =>
        this.fieldFromTypeElement(
          member,
          `${literalTypeDescription}Members${member.name ? capitalize(member.name.getText()) : index}`
        )
      )
      .filter((field): field is Field => field !== null);
  }

  parseInterfaceReferenceTypeNode(typeNode: ts.TypeNode): Field[] | null {
    if (!ts.isTypeReferenceNode(typeNode)) {
      return null;
    }

    const referenceType = this.checker.getTypeFromTypeNode(typeNode);
    const interfaceType = this.getInterfaceMembersAndNameFromType(referenceType);
    if (!interfaceType) {
      return [];
    }

    return interfaceType.members;
  }

  private valueTypeFromTypeNode(
    typeNode: ts.TypeNode,
    nullable: boolean,
    literalTypeDescription: string
  ): ValueType | null {
    if (ts.isUnionTypeNode(typeNode)) {
      return this.extractUnionTypeNode(typeNode, literalTypeDescription, nullable);
    }

    const typeKind = this.basicTypeKindFromTypeNode(typeNode);
    if (typeKind !== null) {
      return {
        kind: typeKind,
        nullable,
      };
    }

    let customTypeKind = this.referenceTypeKindFromTypeNode(typeNode);
    if (customTypeKind !== null) {
      return {
        kind: customTypeKind,
        nullable,
      };
    }

    customTypeKind = this.literalTypeKindFromTypeNode(typeNode, literalTypeDescription);
    if (customTypeKind !== null) {
      return {
        kind: customTypeKind,
        nullable,
      };
    }

    const arrayTypeKind = this.arrayTypeKindFromTypeNode(typeNode, `${literalTypeDescription}Array`);
    if (arrayTypeKind !== null) {
      return {
        kind: arrayTypeKind,
        nullable,
      };
    }

    return null;
  }

  private extractUnionTypeNode(
    node: ts.Node,
    literalTypeDescription: string,
    nullable: boolean
  ): ValueType | null {
    if (!ts.isUnionTypeNode(node)) {
      return null;
    }

    let isNullable = nullable;
    let kind: ValueType['kind'] | undefined;

    node.types.forEach((typeNode) => {
      if (!isNullable && this.isUndefinedOrNull(typeNode)) {
        isNullable = true;
      }
      if (!kind && !this.isUndefinedOrNull(typeNode)) {
        kind = this.valueTypeFromTypeNode(typeNode, false, literalTypeDescription)?.kind;
      }
    });

    if (!kind) {
      return null;
    }

    return {
      kind,
      nullable: isNullable,
    };
  }

  private basicTypeKindFromTypeNode(node: ts.TypeNode): BasicTypeKind | null {
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

  private referenceTypeKindFromTypeNode(node: ts.TypeNode): CustomTypeKind | EnumKind | BasicTypeKind | null {
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

  private literalTypeKindFromTypeNode(node: ts.TypeNode, literalTypeDescription: string): CustomTypeKind | null {
    if (!ts.isTypeLiteralNode(node)) {
      return null;
    }

    const indexField = this.indexFieldFromMembersParent(node, literalTypeDescription);
    if (indexField) {
      return {
        flag: ValueTypeKindFlag.customType,
        name: `${literalTypeDescription}Type`,
        isTypeLiteral: true,
        members: [indexField],
        isAnyKeyDictionary: true,
      };
    }

    const fields = this.parseTypeLiteralNode(node, literalTypeDescription);
    if (fields) {
      return {
        flag: ValueTypeKindFlag.customType,
        name: `${literalTypeDescription}Type`,
        isTypeLiteral: true,
        members: fields,
      };
    }

    return null;
  }

  private arrayTypeKindFromTypeNode(node: ts.TypeNode, literalTypeDescription: string): ArrayTypeKind | null {
    if (!ts.isArrayTypeNode(node)) {
      return null;
    }

    const elementType = this.valueTypeFromTypeNode(node.elementType, false, `${literalTypeDescription}Element`);
    if (elementType) {
      return {
        flag: ValueTypeKindFlag.arrayType,
        elementType,
      };
    }

    return null;
  }

  private isUndefinedOrNull(node: ts.TypeNode): boolean {
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
      return true;
    }
    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return true;
    }
    return false;
  }

  private getAliasType(symbol: ts.Symbol): BasicTypeKind | null {
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

    const indexField = this.indexFieldFromMembersParent(interfaceDeclaration, `${result.name}`);
    if (indexField) {
      result.members = [indexField];
      result.isAnyKeyDictionary = true;
    } else {
      result.members = interfaceDeclaration.members
        .map((item, index) =>
          this.fieldFromTypeElement(
            item,
            `${result.name}Members${item.name ? capitalize(item.name.getText()) : index}`
          )
        )
        .filter((field): field is Field => field !== null);

      const membersInExtendingInterface = this.getExtendingMembersFromInterfaceDeclaration(interfaceDeclaration);
      if (membersInExtendingInterface.length) {
        result.members.push(...membersInExtendingInterface);
      }
    }

    return result;
  }

  private enumTypeKindFromType(type: ts.Type): EnumKind | null {
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
    literalTypeDescription: string
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
        `${literalTypeDescription}IndexMember${capitalize(name)}`
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

  private fieldFromTypeElement(node: ts.TypeElement, literalTypeDescription: string): Field | null {
    if (!ts.isPropertySignature(node) || node.type === undefined) {
      return null;
    }

    let name = node.name.getText();
    if (!name || name === '__type') {
      name = `${literalTypeDescription}Type`;
    }

    const valueType = this.valueTypeFromNode(node, literalTypeDescription);
    if (valueType !== null) {
      return {
        name,
        type: valueType,
      };
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
      const { members, isAnyKeyDictionary } = this.getInterfaceMembersAndNameFromType(type);
      return isAnyKeyDictionary ? [] : members;
    });
  }
}
