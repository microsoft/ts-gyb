import fs from 'fs';
import path from 'path';
import { dropIPrefixInCustomTypes, fetchNamedTypes, NamedType } from './named-types';
import { Parser } from '../parser/Parser';
import { renderCode } from '../renderer/renderer';
import { SwiftCustomTypeView } from '../renderer/swift/SwiftCustomTypeView';
import { SwiftEnumTypeView } from '../renderer/swift/SwiftEnumTypeView';
import { SwiftModuleView } from '../renderer/swift/SwiftModuleView';
import { CustomTypeView, EnumTypeView, ModuleView, NamedTypesView } from '../renderer/views';
import { serializeModule, serializeNamedType } from '../serializers';
import { CustomType, EnumType, isCustomType, Module } from '../types';
import { applyDefaultCustomTags } from './utils';

export enum RenderingLanguage {
  Swift = 'Swift',
}

export class CodeGenerator {
  private modulesMap: Record<string, Module[]> = {};

  private namedTypes: Record<string, NamedType> = {};

  parse({
    tag,
    interfacePaths,
    defaultCustomTags,
    dropInterfaceIPrefix,
  }: {
    tag: string;
    interfacePaths: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultCustomTags: Record<string, any>,
    dropInterfaceIPrefix: boolean;
  }): void {
    const parser = new Parser(interfacePaths);
    const modules = parser.parse();

    modules.forEach((module) => applyDefaultCustomTags(module, defaultCustomTags));

    if (dropInterfaceIPrefix) {
      dropIPrefixInCustomTypes(modules);
    }

    const namedTypes = fetchNamedTypes(modules);

    this.modulesMap[tag] = modules;
    this.pushNamedTypes(namedTypes);
  }

  printModules({ tag }: { tag: string }): void {
    const modules = this.modulesMap[tag];
    if (modules === undefined) {
      throw Error('Modules not parsed. Run parse first.');
    }

    console.log('Modules:\n');
    console.log(modules.map((module) => serializeModule(module)).join('\n\n'));
  }

  printNamedTypes(): void {
    console.log('\nNamed types:\n');
    console.log(
      Object.entries(this.namedTypes)
        .map(([typeName, namedType]) => serializeNamedType(typeName, namedType))
        .join('\n\n')
    );
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

    modules.forEach((module) => {
      const moduleView = this.getModuleView(language, module);
      const renderedCode = renderCode(moduleTemplatePath, moduleView);

      this.writeFile(renderedCode, outputDirectory, `${moduleView.moduleName}${this.getFileExtension(language)}`);
    });

    const namedTypesView = this.getNamedTypesView(language, this.namedTypes);
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

  private pushNamedTypes(namedTypes: Record<string, NamedType>): void {
    Object.entries(namedTypes).forEach(([typeName, namedType]) => {
      if (this.namedTypes[typeName] !== undefined) {
        return;
      }

      this.namedTypes[typeName] = namedType;
    });
  }
}
