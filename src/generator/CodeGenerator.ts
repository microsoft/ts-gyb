import fs from 'fs';
import path from 'path';
import { dropIPrefixInCustomTypes, fetchNamedTypes, NamedType, NamedTypesResult } from './named-types';
import { Parser } from '../parser/Parser';
import { renderCode } from '../renderer/renderer';
import { SwiftCustomTypeView } from '../renderer/swift/SwiftCustomTypeView';
import { SwiftEnumTypeView } from '../renderer/swift/SwiftEnumTypeView';
import { SwiftModuleView } from '../renderer/swift/SwiftModuleView';
import { CustomTypeView, EnumTypeView, ModuleView, NamedTypeView } from '../renderer/views';
import { serializeModule, serializeNamedType } from '../serializers';
import { CustomType, EnumType, isCustomType, Module } from '../types';
import { applyDefaultCustomTags } from './utils';

export enum RenderingLanguage {
  Swift = 'Swift',
}

export class CodeGenerator {
  private modulesMap: Record<string, Module[]> = {};

  private namedTypes?: NamedTypesResult;

  parse({
    tag,
    interfacePaths,
    defaultCustomTags,
    dropInterfaceIPrefix,
  }: {
    tag: string;
    interfacePaths: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultCustomTags: Record<string, any>;
    dropInterfaceIPrefix: boolean;
  }): void {
    const parser = new Parser(interfacePaths);
    const modules = parser.parse();

    modules.forEach((module) => applyDefaultCustomTags(module, defaultCustomTags));

    if (dropInterfaceIPrefix) {
      dropIPrefixInCustomTypes(modules);
    }

    this.modulesMap[tag] = modules;
  }

  parseNamedTypes(): void {
    this.namedTypes = fetchNamedTypes(Object.values(this.modulesMap).flatMap((modules) => modules));
  }

  printModules({ tag }: { tag: string }): void {
    const modules = this.modulesMap[tag];
    if (modules === undefined) {
      throw Error('Modules not parsed. Run parse first.');
    }

    console.log('Modules:\n');
    console.log(modules.map((module) => serializeModule(module)).join('\n\n'));
  }

  printSharedNamedTypes(): void {
    if (this.namedTypes === undefined) {
      throw Error('Named types not parsed. Run parseNamedTypes first.');
    }

    console.log('\nShared named types:\n');
    console.log(this.namedTypes.sharedTypes.map((namedType) => serializeNamedType(namedType)).join('\n\n'));
  }

  render({
    tag,
    language,
    outputDirectory,
    moduleTemplatePath,
    namedTypesTemplatePath,
  }: {
    tag: string;
    language: RenderingLanguage;
    outputDirectory: string;
    moduleTemplatePath: string;
    namedTypesTemplatePath: string;
  }): void {
    const modules = this.modulesMap[tag];
    if (modules === undefined) {
      throw Error('Modules not parsed. Run parse first.');
    }
    if (this.namedTypes === undefined) {
      throw Error('Named types not parsed. Run parseNamedTypes first.');
    }

    const { associatedTypes } = this.namedTypes;

    modules.forEach((module) => {
      const moduleView = this.getModuleView(language, module, associatedTypes[module.name] ?? []);
      const renderedCode = renderCode(moduleTemplatePath, moduleView);

      this.writeFile(renderedCode, outputDirectory, `${moduleView.moduleName}${this.getFileExtension(language)}`);
    });

    const namedTypesView = this.namedTypes.sharedTypes.map((namedType) => this.getNamedTypeView(language, namedType));
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

  private getNamedTypeView(language: RenderingLanguage, namedType: NamedType): NamedTypeView {
    let namedTypeView: NamedTypeView;
    if (isCustomType(namedType)) {
      namedTypeView = this.getCustomTypeView(language, namedType.name, namedType);
      namedTypeView.custom = true;
    } else {
      namedTypeView = this.getEnumTypeView(language, namedType);
      namedTypeView.enum = true;
    }

    return namedTypeView;
  }

  private getModuleView(language: RenderingLanguage, module: Module, associatedTypes: NamedType[]): ModuleView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftModuleView(
          module,
          associatedTypes.map((associatedType) => this.getNamedTypeView(language, associatedType))
        );
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

  private getEnumTypeView(language: RenderingLanguage, enumType: EnumType): EnumTypeView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftEnumTypeView(enumType);
      default:
        throw Error('Unhandled language');
    }
  }

  private writeFile(content: string, outputDirectory: string, fileName: string): void {
    const filePath = path.join(outputDirectory, fileName);
    fs.writeFileSync(filePath, content);
  }
}
