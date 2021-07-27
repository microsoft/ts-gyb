import fs from 'fs';
import path from 'path';
import { dropIPrefixInCustomTypes, fetchNamedTypes, NamedType, NamedTypesResult } from './named-types';
import { Parser } from '../parser/Parser';
import { renderCode } from '../renderer/renderer';
import { NamedTypeView, ModuleView, InterfaceTypeView, EnumTypeView } from '../renderer/views';
import { serializeModule, serializeNamedType } from '../serializers';
import { isInterfaceType, Module } from '../types';
import { applyDefaultCustomTags } from './utils';
import { ValueTransformer, SwiftValueTransformer, KotlinValueTransformer } from '../renderer/value-transformer';

export enum RenderingLanguage {
  Swift = 'Swift',
  Kotlin = 'Kotlin',
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
    skipInvalidMethods,
  }: {
    tag: string;
    interfacePaths: string[];
    predefinedTypes: Set<string>;
    defaultCustomTags: Record<string, unknown>;
    dropInterfaceIPrefix: boolean;
    skipInvalidMethods: boolean;
  }): void {
    const parser = new Parser(interfacePaths, predefinedTypes, skipInvalidMethods);
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
    const valueTransformer = this.getValueTransformer(language, typeNameMap);

    modules.forEach((module) => {
      const moduleView = this.getModuleView(module, associatedTypes[module.name] ?? [], valueTransformer);
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

    const valueTransformer = this.getValueTransformer(language, typeNameMap);

    const namedTypesView = this.namedTypes.sharedTypes.map((namedType) =>
      this.getNamedTypeView(namedType, valueTransformer)
    );
    const renderedCode = renderCode(namedTypesTemplatePath, namedTypesView);
    fs.writeFileSync(namedTypesOutputPath, renderedCode);
  }

  private getFileExtension(language: RenderingLanguage): string {
    switch (language) {
      case RenderingLanguage.Swift:
        return '.swift';
      case RenderingLanguage.Kotlin:
        return '.kt';
      default:
        throw Error('Unhandled language');
    }
  }

  private getNamedTypeView(namedType: NamedType, valueTransformer: ValueTransformer): NamedTypeView {
    let namedTypeView: NamedTypeView;
    if (isInterfaceType(namedType)) {
      namedTypeView = new InterfaceTypeView(namedType.name, namedType, valueTransformer);
      namedTypeView.custom = true;
    } else {
      namedTypeView = new EnumTypeView(namedType, valueTransformer);
      namedTypeView.enum = true;
    }

    return namedTypeView;
  }

  private getModuleView(module: Module, associatedTypes: NamedType[], valueTransformer: ValueTransformer): ModuleView {
    return new ModuleView(
      module,
      associatedTypes.map((associatedType) => this.getNamedTypeView(associatedType, valueTransformer)),
      valueTransformer
    );
  }

  private getValueTransformer(language: RenderingLanguage, typeNameMap: Record<string, string>): ValueTransformer {
    switch (language) {
      case RenderingLanguage.Swift:
        return new SwiftValueTransformer(typeNameMap);
      case RenderingLanguage.Kotlin:
        return new KotlinValueTransformer(typeNameMap);
      default:
        throw Error('Unhandled language');
    }
  }

  private writeFile(content: string, outputDirectory: string, fileName: string): void {
    const filePath = path.join(outputDirectory, fileName);
    fs.writeFileSync(filePath, content);
  }
}
