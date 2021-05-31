import ts from 'typescript';
import { glob } from 'glob';
import {
  Module,
  Method,
  Field,
} from '../types';
import { ValueParser } from './ValueParser';
import { shouldExportSymbol } from './utils';

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

    const symbol = this.checker.getSymbolAtLocation(node.name);

    if (symbol && !shouldExportSymbol(symbol)) {
      return null;
    }

    if (node.name === undefined) {
      return null;
    }

    const interfaceName = node.name.text;

    const methods: Method[] = node.members
      .map(methodNode => this.methodFromNode(methodNode))
      .filter((method): method is Method => method !== null);

    const documentation = ts.displayPartsToString(symbol?.getDocumentationComment(this.checker));

    return {
      name: interfaceName,
      methods,
      documentation,
    };
  }

  private methodFromNode(node: ts.Node): Method | null {
    if (!ts.isMethodSignature(node)) {
      return null;
    }

    const methodName = node.name.getText();

    const parameters = this.fieldsFromParameters(node.parameters);

    const returnType = this.valueParser.parseFunctionReturnType(node);

    const symbol = this.checker.getSymbolAtLocation(node.name);
    const documentation = ts.displayPartsToString(symbol?.getDocumentationComment(this.checker));

    return {
      name: methodName,
      parameters,
      returnType,
      documentation,
    };
  }

  private fieldsFromParameters(parameterNodes: ts.NodeArray<ts.ParameterDeclaration>): Field[] {
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

    return this.valueParser.parseFunctionParameterType(parameterDeclaration.type);
  }
}
