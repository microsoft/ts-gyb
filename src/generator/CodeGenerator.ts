import fs from 'fs';
import path from 'path';
import { dropIPrefixInCustomTypes, extractTargetsSharedTypes, NamedTypeInfo, ParsedModule, ParsedTarget, parseTarget } from './named-types';
import { Parser } from '../parser/Parser';
import { renderCode } from '../renderer/renderer';
import { NamedTypeView, ModuleView, InterfaceTypeView, EnumTypeView } from '../renderer/views';
import { serializeModule, serializeNamedType } from '../serializers';
import { isInterfaceType } from '../types';
import { applyDefaultCustomTags } from './utils';
import { ValueTransformer, SwiftValueTransformer, KotlinValueTransformer } from '../renderer/value-transformer';

export enum RenderingLanguage {
  Swift = 'Swift',
  Kotlin = 'Kotlin',
}

export interface RenderOptions {
  language: RenderingLanguage;
  outputPath: string;
  templatePath: string;
  typeNameMap: Record<string, string>;
}

export class CodeGenerator {
  constructor(
    private readonly predefinedTypes: Set<string>,
    private readonly defaultCustomTags: Record<string, unknown>,
    private readonly skipInvalidMethods: boolean,
    private readonly dropInterfaceIPrefix: boolean,
  ) {}

  parseTarget(interfacePaths: string[], exportedInterfaceBases?: Set<string>): ParsedTarget {
    const parser = new Parser(interfacePaths, this.predefinedTypes, this.skipInvalidMethods, exportedInterfaceBases);
    const modules = parser.parse();

    modules.forEach((module) => applyDefaultCustomTags(module, this.defaultCustomTags));

    if (this.dropInterfaceIPrefix) {
      dropIPrefixInCustomTypes(modules);
    }

    return parseTarget(modules);
  }

  extractTargetsSharedTypes(targets: ParsedTarget[]): NamedTypeInfo[] {
    return extractTargetsSharedTypes(targets);
  }

  printTarget(modules: ParsedModule[]): void {
    console.log('Modules:\n');
    console.log(
      modules
        .map((module) =>
          serializeModule(
            module,
            module.associatedTypes.map((associatedType) => associatedType.type)
          )
        )
        .join('\n\n')
    );
    console.log();
  }

  printSharedTypes(sharedTypes: NamedTypeInfo[]): void {
    console.log('Shared named types:\n');
    console.log(sharedTypes.map((namedType) => serializeNamedType(namedType.type)).join('\n\n'));
  }

  renderModules(modules: ParsedModule[], options: RenderOptions): void {
    const valueTransformer = this.getValueTransformer(options.language, options.typeNameMap);

    const moduleViews = modules.map((module) =>
      this.getModuleView(module, valueTransformer)
    );

    if (path.extname(options.outputPath) === '') {
      // The path is a directory
      moduleViews.forEach((moduleView) => {
        const renderedCode = renderCode(options.templatePath, moduleView);

        this.writeFile(renderedCode, path.join(options.outputPath, `${moduleView.moduleName}${this.getFileExtension(options.language)}`));
      });
    } else {
      moduleViews.forEach((moduleView, index) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        (moduleView as any).last = index === moduleViews.length - 1;
      });
      const renderedCode = renderCode(options.templatePath, moduleViews);
      this.writeFile(renderedCode, options.outputPath);
    }
  }

  renderNamedTypes(sharedTypes: NamedTypeInfo[], options: RenderOptions): void {
    const valueTransformer = this.getValueTransformer(options.language, options.typeNameMap);

    const namedTypesView = sharedTypes.map((namedType) =>
      this.getNamedTypeView(namedType, valueTransformer)
    );
    const renderedCode = renderCode(options.templatePath, namedTypesView);
    this.writeFile(renderedCode, options.outputPath);
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
    module: ParsedModule,
    valueTransformer: ValueTransformer
  ): ModuleView {
    return new ModuleView(
      module,
      module.associatedTypes.map((associatedType) => this.getNamedTypeView(associatedType, valueTransformer)),
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

  private writeFile(content: string, filePath: string): void {
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
  }
}
