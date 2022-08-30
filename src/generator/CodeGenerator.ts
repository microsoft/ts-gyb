import fs from 'fs';
import path from 'path';
import { dropIPrefixInCustomTypes, fetchNamedTypes, NamedTypeInfo, NamedTypesResult } from './named-types';
import { Parser } from '../parser/Parser';
import { renderCode } from '../renderer/renderer';
import { NamedTypeView, ModuleView, InterfaceTypeView, EnumTypeView } from '../renderer/views';
import { serializeModule, serializeNamedType } from '../serializers';
import { isInterfaceType, Module } from '../types';
import { applyDefaultCustomTags } from './utils';
import { ValueTransformer, SwiftValueTransformer, KotlinValueTransformer } from '../renderer/value-transformer';
import { Configuration } from '../configuration';

export enum RenderingLanguage {
  Swift = 'Swift',
  Kotlin = 'Kotlin',
}

export class CodeGenerator {
  private modulesMap: Record<string, Module[]> = {};

  private namedTypes?: NamedTypesResult;

  generate(config: Configuration): void {
    Object.entries(config.parsing.targets).forEach(([tag, target]) => {
      this.parse({
        tag,
        interfacePaths: target.source,
        predefinedTypes: new Set(config.parsing.predefinedTypes ?? []),
        defaultCustomTags: config.parsing.defaultCustomTags ?? {},
        dropInterfaceIPrefix: config.parsing.dropInterfaceIPrefix ?? false,
        skipInvalidMethods: config.parsing.skipInvalidMethods ?? false,
        exportedInterfaceBases: target.exportedInterfaceBases,
      });
    });

    this.parseNamedTypes();
    this.printSharedNamedTypes();

    Object.entries(config.parsing.targets).forEach(([tag]) => {
      this.printModules({ tag });
    });

    const languageRenderingConfigs = [
      { language: RenderingLanguage.Swift, renderingConfig: config.rendering.swift },
      { language: RenderingLanguage.Kotlin, renderingConfig: config.rendering.kotlin },
    ];

    languageRenderingConfigs.forEach(({ language, renderingConfig }) => {
      if (renderingConfig === undefined) {
        return;
      }

      renderingConfig.renders.forEach((render) => {
        this.renderModules({
          tag: render.target,
          language,
          outputPath: render.outputPath,
          moduleTemplatePath: render.template,
          typeNameMap: renderingConfig.typeNameMap ?? {},
        });
      });

      this.renderNamedTypes({
        language,
        namedTypesTemplatePath: renderingConfig.namedTypesTemplatePath,
        namedTypesOutputPath: renderingConfig.namedTypesOutputPath,
        typeNameMap: renderingConfig.typeNameMap ?? {},
      });
    });
  }

  parse({
    tag,
    interfacePaths,
    predefinedTypes,
    defaultCustomTags,
    dropInterfaceIPrefix,
    skipInvalidMethods,
    exportedInterfaceBases,
  }: {
    tag: string;
    interfacePaths: string[];
    predefinedTypes: Set<string>;
    defaultCustomTags: Record<string, unknown>;
    dropInterfaceIPrefix: boolean;
    skipInvalidMethods: boolean;
    exportedInterfaceBases: string[] | undefined;
  }): void {
    const parser = new Parser(interfacePaths, predefinedTypes, skipInvalidMethods, exportedInterfaceBases !== undefined ? new Set(exportedInterfaceBases) : undefined);
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
      modules
        .map((module) =>
          serializeModule(
            module,
            (this.namedTypes?.associatedTypes[module.name] ?? []).map((associatedType) => associatedType.type)
          )
        )
        .join('\n\n')
    );
    console.log();
  }

  printSharedNamedTypes(): void {
    if (this.namedTypes === undefined) {
      throw Error('Named types not parsed. Run parseNamedTypes first.');
    }

    console.log('Shared named types:\n');
    console.log(this.namedTypes.sharedTypes.map((namedType) => serializeNamedType(namedType.type)).join('\n\n'));
  }

  renderModules({
    tag,
    language,
    outputPath,
    moduleTemplatePath,
    typeNameMap,
  }: {
    tag: string;
    language: RenderingLanguage;
    outputPath: string;
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

    const moduleViews = modules.map((module) =>
      this.getModuleView(module, associatedTypes[module.name] ?? [], valueTransformer)
    );

    if (path.extname(outputPath) === '') {
      // The path is a directory
      moduleViews.forEach((moduleView) => {
        const renderedCode = renderCode(moduleTemplatePath, moduleView);

        this.writeFile(renderedCode, outputPath, `${moduleView.moduleName}${this.getFileExtension(language)}`);
      });
    } else {
      moduleViews.forEach((moduleView, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (moduleView as any).last = index === moduleViews.length - 1;
      });
      const renderedCode = renderCode(moduleTemplatePath, moduleViews);
      fs.writeFileSync(outputPath, renderedCode);
    }
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

    if (this.namedTypes.sharedTypes.length === 0) {
      return;
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

  private getNamedTypeView(namedType: NamedTypeInfo, valueTransformer: ValueTransformer): NamedTypeView {
    let namedTypeView: NamedTypeView;
    if (isInterfaceType(namedType.type)) {
      namedTypeView = new InterfaceTypeView(namedType.type, namedType.source, valueTransformer);
      namedTypeView.custom = true;
    } else {
      namedTypeView = new EnumTypeView(namedType.type, namedType.source, valueTransformer);
      namedTypeView.enum = true;
    }

    return namedTypeView;
  }

  private getModuleView(
    module: Module,
    associatedTypes: NamedTypeInfo[],
    valueTransformer: ValueTransformer
  ): ModuleView {
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
    if (!fs.existsSync(outputDirectory)) {
      fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const filePath = path.join(outputDirectory, fileName);
    fs.writeFileSync(filePath, content);
  }
}
