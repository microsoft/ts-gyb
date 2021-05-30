import ts from 'typescript';
import { glob } from 'glob';
import {
  Module,
  Method,
  Field,
} from '../types';
import { ValueParser } from './ValueParser';
import { capitalize } from '../utils';

// Defined tags
const SHOULD_EXPORT = 'shouldExport';
const COMMENT = 'comment';

export class Parser {
  private program: ts.Program;

  private checker: ts.TypeChecker;

  private valueParser: ValueParser;

  constructor(globPatterns: string[]) {
    const filePaths = globPatterns.flatMap((pattern) => glob.sync(pattern));
    this.program = ts.createProgram({
      rootNames: filePaths,
      options: {},
    });
    this.checker = this.program.getTypeChecker();
    this.valueParser = new ValueParser(this.checker);
  }

  parse(): Module[] {
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
  }

  private moduleFromNode(node: ts.Node): Module | null {
    if (!ts.isInterfaceDeclaration(node)) {
      return null;
    }

    const { symbol } = this.checker.getTypeAtLocation(node);
    const jsDocTags = symbol.getJsDocTags();

    if (!this.shouldExportInJsDocTags(jsDocTags)) {
      return null;
    }

    if (node.name === undefined) {
      return null;
    }

    const interfaceName = node.name.text;

    const methods: Method[] = node.members
      .map(methodNode => this.methodFromNode(methodNode))
      .filter((method): method is Method => method !== null);

    return {
      name: interfaceName,
      methods,
    };
  }

  private methodFromNode(node: ts.Node): Method | null {
    if (!ts.isMethodSignature(node)) {
      return null;
    }

    const methodName = node.name.getText();

    const parameters = this.fieldsFromParameters(node.parameters, capitalize(methodName));

    const returnType = this.valueParser.valueTypeFromNode(node, `${capitalize(methodName)}Return`);

    const jsDocTags = ts.getJSDocTags(node) as ts.JSDocTag[];
    const nativeComment = this.getCommentFromJsDocNodes(jsDocTags);

    return {
      name: methodName,
      parameters,
      returnType,
      comment: nativeComment,
    };
  }

  private fieldsFromParameters(parameterNodes: ts.NodeArray<ts.ParameterDeclaration>, literalTypeDescription: string): Field[] {
    if (parameterNodes.length === 0) {
      return [];
    }
    if (parameterNodes.length !== 1) {
      throw new Error('The exported API can only have one parameter, if multiple parameters are needed, use an object');
    }

    const parameterDeclaration = parameterNodes[0];

    if (parameterDeclaration.type === undefined) {
      return [];
    }

    const typeLiteralFields = this.valueParser.parseTypeLiteralNode(parameterDeclaration.type, literalTypeDescription);
    if (typeLiteralFields !== null) {
      return typeLiteralFields;
    }

    const interfaceFeilds = this.valueParser.parseInterfaceReferenceTypeNode(parameterDeclaration.type);
    if (interfaceFeilds !== null) {
      return interfaceFeilds;
    }

    throw Error('Not supported parameter type');
  }

  private shouldExportInJsDocTags(tags: ts.JSDocTagInfo[]): boolean {
    return !!tags.find((tag) => tag.name === SHOULD_EXPORT && tag.text === 'true');
  }

  private getPropertyFromJsDocNodes(tags: ts.JSDocTag[], name: string): ts.JSDocTagInfo | undefined {
    const target = tags.find((tagNode) => ts.unescapeLeadingUnderscores(tagNode.tagName.escapedText) === name);
    if (target) {
      return {
        name: ts.unescapeLeadingUnderscores(target.tagName.escapedText),
        text: target.comment,
      };
    }
    return undefined;
  }

  private getCommentFromJsDocNodes(tags: ts.JSDocTag[]): string | undefined {
    const commentTag = this.getPropertyFromJsDocNodes(tags, COMMENT);
    if (commentTag && commentTag.text) {
      return commentTag.text;
    }
    return undefined;
  }
}
