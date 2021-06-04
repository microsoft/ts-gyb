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
import { SwiftValueTransformer } from '../renderer/swift/SwiftValueTransformer';

export enum RenderingLanguage {
  Swift = 'Swift',
}

export class CodeGenerator {
  private modulesMap: Record<string, Module[]> = {};

  private namedTypes?: NamedTypesResult;
  
  parse({
    tag,
    interfacePaths,
    predefinedTypes,
    defaultCustomTags,
    dropInterfaceIPrefix,
  }: {
    tag: string;
    interfacePaths: string[];
    predefinedTypes: Set<string>;
    defaultCustomTags: Record<string, unknown>;
    dropInterfaceIPrefix: boolean;
  }): void {
    const parser = new Parser(interfacePaths, predefinedTypes);
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
    console.log(
      modules.map((module) => serializeModule(module, this.namedTypes?.associatedTypes[module.name] ?? [])).join('\n\n')
    );
    console.log();
  }

  printSharedNamedTypes(): void {
    if (this.namedTypes === undefined) {
      throw Error('Named types not parsed. Run parseNamedTypes first.');
    }

    console.log('Shared named types:\n');
    console.log(this.namedTypes.sharedTypes.map((namedType) => serializeNamedType(namedType)).join('\n\n'));
  }

  renderModules({
    tag,
    language,
    outputDirectory,
    moduleTemplatePath,
    typeNameMap,
  }: {
    tag: string;
    language: RenderingLanguage;
    outputDirectory: string;
    moduleTemplatePath: string;
    typeNameMap: Record<string, string>;
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
      const moduleView = this.getModuleView(language, module, associatedTypes[module.name] ?? [], typeNameMap);
      const renderedCode = renderCode(moduleTemplatePath, moduleView);

      this.writeFile(renderedCode, outputDirectory, `${moduleView.moduleName}${this.getFileExtension(language)}`);
    });
  }

  renderNamedTypes({
    language,
    namedTypesTemplatePath,
    namedTypesOutputPath,
    typeNameMap,
  }: {
    language: RenderingLanguage;
    namedTypesTemplatePath: string;
    namedTypesOutputPath: string;
    typeNameMap: Record<string, string>;
  }): void {
    if (this.namedTypes === undefined) {
      throw Error('Named types not parsed. Run parseNamedTypes first.');
    }

    const namedTypesView = this.namedTypes.sharedTypes.map((namedType) => this.getNamedTypeView(language, namedType, typeNameMap));
    const renderedCode = renderCode(namedTypesTemplatePath, namedTypesView);
    fs.writeFileSync(namedTypesOutputPath, renderedCode);
  }

  private getFileExtension(language: RenderingLanguage): string {
    switch (language) {
      case RenderingLanguage.Swift:
        return '.swift';
      default:
        throw Error('Unhandled language');
    }
  }

  private getNamedTypeView(language: RenderingLanguage, namedType: NamedType, typeNameMap: Record<string, string>): NamedTypeView {
    let namedTypeView: NamedTypeView;
    if (isCustomType(namedType)) {
      namedTypeView = this.getCustomTypeView(language, namedType.name, namedType, typeNameMap);
      namedTypeView.custom = true;
    } else {
      namedTypeView = this.getEnumTypeView(language, namedType);
      namedTypeView.enum = true;
    }

    return namedTypeView;
  }

  private getModuleView(language: RenderingLanguage, module: Module, associatedTypes: NamedType[], typeNameMap: Record<string, string>): ModuleView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftModuleView(
          module,
          associatedTypes.map((associatedType) => this.getNamedTypeView(language, associatedType, typeNameMap)),
          new SwiftValueTransformer(typeNameMap),
        );
      default:
        throw Error('Unhandled language');
    }
  }

  private getCustomTypeView(language: RenderingLanguage, typeName: string, customType: CustomType, typeNameMap: Record<string, string>): CustomTypeView {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftCustomTypeView(typeName, customType, new SwiftValueTransformer(typeNameMap));
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
