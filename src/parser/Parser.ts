import ts from 'typescript';
import { glob } from 'glob';
import { Module, isInterfaceType } from '../types';
import { ValueParser } from './ValueParser';
import { parseTypeJSDocTags } from './utils';
import { ParserLogger } from '../logger/ParserLogger';

export class Parser {
  private program: ts.Program;

  private checker: ts.TypeChecker;

  private valueParser: ValueParser;

  constructor(globPatterns: string[], predefinedTypes: Set<string>, skipInvalidMethods = false, private readonly extendedInterfaces: Set<string> | undefined) {
    const filePaths = globPatterns.flatMap((pattern) => glob.sync(pattern));
    this.program = ts.createProgram({
      rootNames: filePaths,
      options: {},
    });
    this.checker = this.program.getTypeChecker();
    this.valueParser = new ValueParser(this.checker, predefinedTypes, new ParserLogger(this.checker), skipInvalidMethods);
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

    const extendedInterfaces = node.heritageClauses?.flatMap((heritageClause) => heritageClause.types.map((type) => type.getText())) ?? [];

    const jsDocTagsResult = parseTypeJSDocTags(symbol);

    if (this.extendedInterfaces !== undefined) {
      if (!(extendedInterfaces.some((extendedInterface) => this.extendedInterfaces?.has(extendedInterface)))) {
        return null;
      }
    } else if (!jsDocTagsResult.shouldExport) {
      return null;
    }

    const result = this.valueParser.parseInterfaceType(node);
    if (result && isInterfaceType(result)) {
      return {
        name: result.name,
        members: result.members,
        methods: result.methods,
        documentation: result.documentation,
        extendedInterfaces,
        customTags: result.customTags,
      };
    }

    return null;
  }
}
