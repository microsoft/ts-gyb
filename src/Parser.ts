import ts from 'typescript';
import { glob } from 'glob';
import {
  Module,
  Method,
  Field,
  ValueType,
  BasicTypeValue,
  CustomTypeKind,
  ArrayTypeKind,
  BasicTypeKind,
  ValueTypeKindFlag,
} from './types';

export class Parser {
  program: ts.Program;

  checker: ts.TypeChecker;

  constructor(globPatterns: string[]) {
    const filePaths = globPatterns.flatMap((pattern) => glob.sync(pattern));
    this.program = ts.createProgram({
      rootNames: filePaths,
      options: {},
    });
    this.checker = this.program.getTypeChecker();
  }

  parse = (): Module[] => {
    const modules: Module[] = [];
    this.program.getSourceFiles().forEach((sourceFile) => {
      ts.forEachChild(sourceFile, (node) => {
        const module = this.moduleFromNode(node);
        if (module !== null) {
          modules.push(module);
        }
      });
    });

    return modules;
  };

  private moduleFromNode = (node: ts.Node): Module | null => {
    if (!this.isNodeExported(node) || !ts.isInterfaceDeclaration(node)) {
      return null;
    }

    if (node.name === undefined) {
      return null;
    }
    const interfaceName = node.name?.text;

    if (node.members === undefined || node.members === null) {
      return null;
    }

    const { symbol } = this.checker.getTypeAtLocation(node);
    const jsDocTags = symbol.getJsDocTags();

    if (!this.shouldExportInJsDocTags(jsDocTags)) {
      return null;
    }

    const methods: Method[] = [];
    node.members.forEach((methodNode) => {
      if (!ts.isPropertySignature(methodNode)) {
        return;
      }

      const methodType = methodNode.type;
      if (!methodType) {
        return;
      }

      if (!ts.isFunctionTypeNode(methodType)) {
        return;
      }

      const method = this.methodFromMethodNode(methodNode.name.getText(), methodType);
      if (method) {
        methods.push(method);
      }
    });

    if (methods.length === 0) {
      return null;
    }

    return {
      name: interfaceName,
      methods,
    };
  };

  private methodFromMethodNode = (methodName: string, node: ts.FunctionTypeNode): Method | null => {
    let parameters: Field[] = [];
    const fields = this.fieldsFromFunctionTypeNodeForParameters(node, this.capitalizeFirstLetter(methodName), true);
    if (fields !== null) {
      parameters = fields;
    }

    let returnValueType: ValueType | null = null;

    if (node.type !== undefined) {
      const valueType = this.valueTypeFromNode(node, `${this.capitalizeFirstLetter(methodName)}Return`);
      if (valueType !== null) {
        returnValueType = valueType;
      }
    }

    return {
      name: methodName,
      parameters,
      returnType: returnValueType,
    };
  };

  private valueTypeFromNode = (
    node: ts.Node & { type?: ts.TypeNode; questionToken?: ts.QuestionToken },
    literalTypeDescription: string
  ): ValueType | null => {
    if (node.type === undefined) {
      return null;
    }
    const nullable = this.isValueTypeNullableFromNode(node);

    return this.valueTypeFromTypeNode(node.type, nullable, literalTypeDescription);
  };

  private isValueTypeNullableFromNode = (
    node: ts.Node & { type?: ts.TypeNode; questionToken?: ts.QuestionToken }
  ): boolean => {
    const nullable = node.questionToken !== undefined;

    return nullable;
  };

  private valueTypeFromTypeNode = (
    typeNode: ts.TypeNode,
    nullable: boolean,
    literalTypeDescription: string
  ): ValueType | null => {
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
  };

  private fieldsFromFunctionTypeNodeForParameters = (
    node: ts.FunctionTypeNode,
    literalTypeDescription: string,
    oneParameterRestriction: boolean
  ): Field[] | null => {
    if (!node.parameters || !node.parameters.length) {
      return null;
    }

    if (oneParameterRestriction && node.parameters.length > 1) {
      throw new Error('The exported API can only have one parameter, if multiple parameters are needed, use an object');
    }

    return node.parameters
      .map((item) =>
        this.fieldFromParameter(
          item,
          `${literalTypeDescription}Parameters${this.getNameWithCapitalFirstLetter(item.name.getText())}`
        )
      )
      .filter((field): field is Field => field !== null);
  };

  private fieldFromParameter = (node: ts.ParameterDeclaration, literalTypeDescription: string): Field | null => {
    const name = node.name.getText();

    const valueType = this.valueTypeFromNode(node, literalTypeDescription);
    if (valueType !== null) {
      return {
        name,
        type: valueType,
      };
    }

    return null;
  };

  private fieldsFromLiteralTypeNode = (type: ts.TypeNode, literalTypeDescription: string): Field[] | null => {
    if (!ts.isTypeLiteralNode(type)) {
      return null;
    }

    return type.members
      .map((item, index) =>
        this.fieldFromTypeElement(
          item,
          `${literalTypeDescription}Members${this.getNameWithCapitalFirstLetter(item.name?.getText()) || index}`
        )
      )
      .filter((field): field is Field => field !== null);
  };

  private fieldFromTypeElement = (node: ts.TypeElement, literalTypeDescription: string): Field | null => {
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
  };


  private indexFieldFromMembersParent = (type: {members: ts.NodeArray<ts.TypeElement>}, literalTypeDescription: string): Field | null => {
    if (type.members && type.members.length !== 1) {
      // Only support interface with one index signature, like { [key: string]: string }
      return null;
    }

    const typeElement = type.members[0];
    if (ts.isIndexSignatureDeclaration(typeElement)) {
      const name = typeElement.parameters[0].name.getText();
      const valueType = this.valueTypeFromNode(typeElement, `${literalTypeDescription}IndexMember${this.getNameWithCapitalFirstLetter(name)}`)
      
      if (valueType !== null && name) {
        return {
          name,
          type: valueType,
        }
      }
    }
    
    return null
  }

  private basicTypeKindFromTypeNode = (node: ts.TypeNode): BasicTypeKind | null => {
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
  };

  private referenceTypeKindFromTypeNode = (node: ts.TypeNode): CustomTypeKind | null => {
    if (!ts.isTypeReferenceNode(node)) {
      return null;
    }

    const { name, members, isAnyKeyDictionary } = this.getInterfaceMembersAndNameFromType(this.checker.getTypeFromTypeNode(node));
    if (members.length === 0) {
      return null;
    }

    return {
      flag: ValueTypeKindFlag.customType,
      name,
      members,
      isAnyKeyDictionary,
    };
  };

  private getInterfaceMembersAndNameFromType(type: ts.Type): {name: string, members: Field[], isAnyKeyDictionary: boolean} {
    const result = {
      name: '',
      members: [] as Field[],
      isAnyKeyDictionary: false,
    };
    const declarations = type.symbol.getDeclarations();
    if (declarations === undefined || declarations.length !== 1) {
      return result;
    }

    const declNode = declarations[0];
    if (!ts.isInterfaceDeclaration(declNode)) {
      return result;
    }

    result.name = declNode.name.getText();

    const indexField = this.indexFieldFromMembersParent(declNode, `${result.name}`);
    if (indexField) {
      result.members = [indexField];
      result.isAnyKeyDictionary = true;
    } else {
      result.members = declNode.members
      .map((item, index) =>
        this.fieldFromTypeElement(
          item,
          `${result.name}Members${this.getNameWithCapitalFirstLetter(item.name?.getText()) || index}`
        )
      )
      .filter((field): field is Field => field !== null);

      const membersInExtendingInterface = this.getExtendingMembersFromInterfaceDeclaration(declNode);
      if (membersInExtendingInterface.length) {
        result.members.push(...membersInExtendingInterface);
      }
    }

    return result;
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
      const {members, isAnyKeyDictionary} = this.getInterfaceMembersAndNameFromType(type);
      return isAnyKeyDictionary ? [] : members;
    })
  }

  private literalTypeKindFromTypeNode = (node: ts.TypeNode, literalTypeDescription: string): CustomTypeKind | null => {
    if (!ts.isTypeLiteralNode(node)) {
      return null;
    }

    const indexField =  this.indexFieldFromMembersParent(node, literalTypeDescription);
    if (indexField) {
      return {
        flag: ValueTypeKindFlag.customType,
        name: `${literalTypeDescription}Type`,
        isTypeLiteral: true,
        members: [indexField],
        isAnyKeyDictionary: true,
      }
    }

    const fields = this.fieldsFromLiteralTypeNode(node, literalTypeDescription);
    if (fields) {
      return {
        flag: ValueTypeKindFlag.customType,
        name: `${literalTypeDescription}Type`,
        isTypeLiteral: true,
        members: fields,
      };
    }

    return null;
  };

  private arrayTypeKindFromTypeNode = (node: ts.TypeNode, literalTypeDescription: string): ArrayTypeKind | null => {
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
  };

  private extractUnionTypeNode = (
    node: ts.Node,
    literalTypeDescription: string,
    nullable: boolean
  ): ValueType | null => {
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
  };

  private isUndefinedOrNull = (node: ts.TypeNode): boolean => {
    if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
      return true;
    }
    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return true;
    }
    return false;
  };

  private isNodeExported = (node: ts.Node): boolean =>
    (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);

  private isNodeExtended(node: ts.InterfaceDeclaration, extendedInterfaceName: string): boolean {
    if (!node.heritageClauses?.length) {
      return false;
    }
    const extendHeritageClause = node.heritageClauses.find((item) => item.token === ts.SyntaxKind.ExtendsKeyword);
    if (!extendHeritageClause) {
      return false;
    }
    const extendedInterface = extendHeritageClause.types.find(
      (item) => this.checker.getTypeAtLocation(item).symbol?.escapedName === extendedInterfaceName
    );
    return !!extendedInterface;
  }

  private getNameWithCapitalFirstLetter(name?: string): string | undefined {
    let targetName = name;
    if (name && name.length > 0) {
      targetName = name[0].toUpperCase() + name.slice(1);
    }
    return targetName;
  }

  private shouldExportInJsDocTags(tags: ts.JSDocTagInfo[]): boolean {
    return !!tags.find((tag) => tag.name === 'shouldExport' && tag.text === 'true');
  }

  private capitalizeFirstLetter(name: string): string {
    let res = name;
    if (res.length === 0) {
      return res;
    }
    res = res[0].toUpperCase() + res.slice(1);
    return res
  }
}
