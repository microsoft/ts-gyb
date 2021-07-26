import ts from 'typescript';
import { glob } from 'glob';
import { Module, Method, Field, ValueType } from '../types';
import { ValueParser } from './ValueParser';
import { parseModuleJSDocTags } from './utils';
import { ParserLogger } from '../logger/ParserLogger';
import { ValueParserError } from './ValueParserError';
import {ParserError} from './ParserError';

export class Parser {
  private program: ts.Program;

  private checker: ts.TypeChecker;

  private valueParser: ValueParser;

  private logger: ParserLogger;

  constructor(
    globPatterns: string[], 
    predefinedTypes: Set<string>,
    private skipInvalidMethods: boolean = false,
  ) {
    const filePaths = globPatterns.flatMap((pattern) => glob.sync(pattern));
    this.program = ts.createProgram({
      rootNames: filePaths,
      options: {},
    });
    this.checker = this.program.getTypeChecker();
    this.valueParser = new ValueParser(this.checker, predefinedTypes);
    this.logger = new ParserLogger(this.checker);
  }

  parse(): Module[] {
    const modules: Module[] = [];

    this.program.getRootFileNames().forEach((fileName) => {
      const sourceFile = this.program.getSourceFile(fileName);
      if (sourceFile === undefined) {
        throw Error('Source file not found');
      }
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
    if (symbol === undefined) {
      throw Error('Invalid module node');
    }

    const jsDocTagsResult = parseModuleJSDocTags(symbol);

    if (!jsDocTagsResult.shouldExport) {
      return null;
    }

    const interfaceName = jsDocTagsResult.overrideName ?? node.name.text;

    const methods: Method[] = node.members
      .map((methodNode) => {
        try {
          return this.methodFromNode(methodNode);
        } catch (error) {
          if (error instanceof ParserError) {
            if (this.skipInvalidMethods) {
              this.logger.warnSkippedNode(error.node, error.reason, error.guide);
              return null;
            }

            throw error;
          }

          throw error;
        }
      })
      .filter((method): method is Method => method !== null);

    const documentation = ts.displayPartsToString(symbol?.getDocumentationComment(this.checker));

    return {
      name: interfaceName,
      methods,
      documentation,
      customTags: jsDocTagsResult.customTags,
    };
  }

  private methodFromNode(node: ts.Node): Method | null {
    if (!ts.isMethodSignature(node)) {
      throw new ParserError(node, 'it is not valid method signature', 'Please define only methods');
    }

    const methodName = node.name.getText();

    let parameters: Field[];
    try {
      parameters = this.fieldsFromParameters(node);
    } catch (error) {
      if (error instanceof ValueParserError) {
        throw new ParserError(node, `parameters error: ${error.message}`, error.guide);
      }

      throw error;
    }

    let returnType: ValueType | null;
    try {
      returnType = this.valueParser.parseFunctionReturnType(node);

    } catch (error) {
      if (error instanceof ValueParserError) {
        this.logger.warn(error.message);
        throw new ParserError(node, `return type error: ${error.message}`, error.guide);
      }

      throw error;
    }

    const symbol = this.checker.getSymbolAtLocation(node.name);
    const documentation = ts.displayPartsToString(symbol?.getDocumentationComment(this.checker));

    return {
      name: methodName,
      parameters,
      returnType,
      documentation,
    };
  }

  private fieldsFromParameters(methodSignature: ts.MethodSignature): Field[] {
    const parameterNodes = methodSignature.parameters;

    if (parameterNodes.length === 0) {
      return [];
    }
    if (parameterNodes.length > 1) {
      throw new ParserError(methodSignature, 'it has multiple parameters', 'Methods should only have one property. Please use destructuring object for multiple parameters');
    }

    const parameterDeclaration = parameterNodes[0];
    if (parameterDeclaration.type === undefined) {
      return [];
    }

    return this.valueParser.parseFunctionParameterType(parameterDeclaration.type);
  }
}
