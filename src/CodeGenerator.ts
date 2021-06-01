import fs from 'fs';
import path from 'path';
import { dropIPrefixInCustomTypes, fetchNamedTypes, NamedType } from './parser/named-types';
import { Parser } from './parser/Parser';
import { renderCode } from './renderer/renderer';
import { SwiftCustomTypeView } from './renderer/swift/SwiftCustomTypeView';
import { SwiftEnumTypeView } from './renderer/swift/SwiftEnumTypeView';
import { SwiftModuleView } from './renderer/swift/SwiftModuleView';
import { CustomTypeView, EnumTypeView, ModuleView, NamedTypesView } from './renderer/views';
import { serializeModule, serializeNamedType } from './serializers';
import { CustomType, EnumType, isCustomType, Module } from './types';

export enum RenderingLanguage {
  Swift = 'Swift',
}

export class CodeGenerator {
  private readonly parser: Parser;

  private parsedResult: { modules: Module[]; namedTypes: Record<string, NamedType> } | undefined;

  constructor(interfacePaths: string[]) {
    this.parser = new Parser(interfacePaths);
  }

  parse(dropInterfaceIPrefix: boolean): void {
    const modules = this.parser.parse();

    if (dropInterfaceIPrefix) {
      dropIPrefixInCustomTypes(modules);
    }

    const namedTypes = fetchNamedTypes(modules);

    this.parsedResult = { modules, namedTypes };
  }

  print(): void {
    if (this.parsedResult === undefined) {
      throw Error('Not parsed. Please run parse first');
    }

    console.log('Modules:\n');
    console.log(this.parsedResult.modules.map((module) => serializeModule(module)).join('\n\n'));
    console.log('\nNamed types:\n');
    console.log(
      Object.entries(this.parsedResult.namedTypes)
        .map(([typeName, namedType]) => serializeNamedType(typeName, namedType))
        .join('\n\n')
    );
  }

  render({
    language,
    outputDirectory,
    moduleTemplatePath,
    namedTypesTemplatePath,
  }: {
    language: RenderingLanguage;
    outputDirectory: string;
    moduleTemplatePath: string;
    namedTypesTemplatePath: string;
  }): void {
    if (this.parsedResult === undefined) {
      throw Error('Not parsed. Please run parse first');
    }

    const { modules, namedTypes } = this.parsedResult;

    modules.forEach((module) => {
      const moduleView = this.getModuleView(language, module);
      const renderedCode = renderCode(moduleTemplatePath, moduleView);

      this.writeFile(renderedCode, outputDirectory, `${moduleView.moduleName}${this.getFileExtension(language)}`);
    });

    const namedTypesView = this.getNamedTypesView(language, namedTypes);
    const renderedCode = renderCode(namedTypesTemplatePath, namedTypesView);
    this.writeFile(renderedCode, outputDirectory, `Generated_CustomInterface${this.getFileExtension(language)}`);
  }

  private getFileExtension(language: RenderingLanguage): string {
    switch (language) {
      case RenderingLanguage.Swift:
        return '.swift';
      default:
        throw Error('Unhandled language');
    }
  }

  private getNamedTypesView(language: RenderingLanguage, namedTypes: Record<string, NamedType>): NamedTypesView {
    const namedTypesView: NamedTypesView = { customTypes: [], enumTypes: [] };

    Object.entries(namedTypes).forEach(([typeName, namedType]) => {
      if (isCustomType(namedType)) {
        namedTypesView.customTypes.push(this.getCustomTypeView(language, typeName, namedType));
      } else {
        namedTypesView.enumTypes.push(this.getEnumTypeView(language, typeName, namedType));
      }
    });

    return namedTypesView;
  }

  private getModuleView(language: RenderingLanguage, module: Module): ModuleView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftModuleView(module);
      default:
        throw Error('Unhandled language');
    }
  }

  private getCustomTypeView(language: RenderingLanguage, typeName: string, customType: CustomType): CustomTypeView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftCustomTypeView(typeName, customType);
      default:
        throw Error('Unhandled language');
    }
  }

  private getEnumTypeView(language: RenderingLanguage, typeName: string, enumType: EnumType): EnumTypeView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftEnumTypeView(typeName, enumType);
      default:
        throw Error('Unhandled language');
    }
  }

  private writeFile(content: string, outputDirectory: string, fileName: string): void {
    const filePath = path.join(outputDirectory, fileName);
    fs.writeFileSync(filePath, content);
  }
}
