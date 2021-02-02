import fs from 'fs';
import path from 'path';
import { Method, Module, ValueTypeKindFlag } from '../types';
import { RendererConfig } from './RenderConfig';
import { InternalDataStructure } from './InternalDataStructure';
import { GenericCodeRenderer } from './GenericCodeRenderer';
import { TypeTransformer } from './CustomTypeCollector';
import { SourceLike } from './SourceLike';

type ModuleName = string;

export class SwiftCodeRenderer extends GenericCodeRenderer {
  constructor(
    rendererConfig: RendererConfig,
    private typeTransformer: TypeTransformer,
    private parsedModules: Module[],
    private outputPath: string
  ) {
    super(rendererConfig);
  }

  private modulesSourceLines: Record<ModuleName, SourceLike[]> = {};

  private interfaceSourceLines: SourceLike[] = [];

  public toSourceCode(): SourceLike[] {
    super.toSourceCode();
    return Object.values(this.modulesSourceLines).reduce((pre: SourceLike[], value: SourceLike[]) => {
      pre.push(...value);
      return pre;
    }, []);
  }

  protected getFormattedContentWithTemplate(): Record<ModuleName, string> {
    this.toSourceCode();
    const result = {} as Record<ModuleName, string>;
    Object.keys(this.modulesSourceLines).forEach((moduleName) => {
      const { headerTemplate, footerTemplate, modules } = this.rendererConfig;
      const { definedValues = {} } = modules[moduleName];
      let content = this.modulesSourceLines[moduleName].join('\n');
      if (headerTemplate) {
        content = `${this.updateTemplateWithParams(headerTemplate, definedValues)}\n${content}`;
      }
      if (footerTemplate) {
        content = `${content}\n${this.updateTemplateWithParams(footerTemplate, definedValues)}`;
      }
      result[moduleName] = content;
    });

    return result;
  }

  private updateTemplateWithParams(template: string, params: { [k: string]: string }): string {
    return template.replace(
      /%%([a-zA-Z_$][a-zA-Z_$0-9]*)%%/g,
      (match: string, paramName: string): string => params[paramName] || 'undefined'
    );
  }

  private getParameterSource(method: Method): string[] {
    const hasParam = method.parameters.length === 1;
    if (!hasParam) {
      return [];
    }
    const parameter = method.parameters[0];
    const parameterType = parameter.type;
    switch (parameterType.kind.flag) {
      case ValueTypeKindFlag.basicType:
      case ValueTypeKindFlag.arrayType:
        return [`${parameter.name}: ${this.typeTransformer.transformType(parameter.type)}`];
      case ValueTypeKindFlag.customType:
        return parameterType.kind.members.map(
          (field) => `${field.name}: ${this.typeTransformer.transformType(field.type)}`
        );
      default:
        return [];
    }
  }

  private emitArgsDeclarationAndInstantiation(method: Method): void {
    const hasParam = method.parameters.length === 1;
    if (!hasParam) {
      return;
    }

    const parameter = method.parameters[0];
    const parameterType = parameter.type;
    const { baseIndent } = this.rendererConfig;
    switch (parameterType.kind.flag) {
      case ValueTypeKindFlag.basicType:
      case ValueTypeKindFlag.arrayType:
        this.emitLine(2 + baseIndent, `let args = ${parameter.name}`);
        break;
      case ValueTypeKindFlag.customType: {
        const argSource = new InternalDataStructure(
          this.rendererConfig,
          'Args',
          this.typeTransformer,
          parameterType.kind.members
        ).toSourceCode();
        this.emitLines(2 + baseIndent, argSource);

        this.emitLine(2 + baseIndent, `let args = Args(`);
        parameterType.kind.members.forEach((param, index, arr) => {
          const isLast = index === arr.length - 1;
          this.emitLine(4 + baseIndent, `${param.name}: ${param.name}${isLast ? '' : ','}`);
        });
        this.emitLine(2 + baseIndent, `)`);
        break;
      }
      default:
        break;
    }
  }

  private renderCustomInterface(): void {
    const { baseIndent } = this.rendererConfig;

    if (this.rendererConfig.customInterfaceFileName) {
      this.currentSourceLines = [] as SourceLike[];
      this.emitLines(0 + baseIndent, this.typeTransformer.toSourceLike());
      this.interfaceSourceLines = this.currentSourceLines;
    }
  }

  render(): void {
    const apiModules = this.parsedModules;
    const { baseIndent } = this.rendererConfig;
    apiModules.forEach((module) => {
      this.currentSourceLines = [] as SourceLike[];
      this.namespaces.push(module.name);
      module.methods.forEach((method) => {
        // Methods should have only one parameter which is basic type or object
        if (method.parameters.length > 1) {
          throw new Error(
            'The exported API can only have one parameter, if multiple parameters are needed, use an object'
          );
        }
        const hasParam = method.parameters.length === 1;

        const source = `${method.name}`;
        const parameterSource = this.getParameterSource(method);

        let returnTypeStatement: string;
        if (method.returnType !== null) {
          const returnTypeString = this.typeTransformer.transformType(method.returnType, true);

          returnTypeStatement = `@escaping (BridgeCompletion<${returnTypeString}?>)`;
        } else {
          returnTypeStatement = `BridgeJSExecutor.Completion? = nil`;
        }
        parameterSource.push(`completion: ${returnTypeStatement})`);
        const parameterSourceStatement = parameterSource.join(', ');

        const modifier = this.rendererConfig.makeFunctionPublic ? 'public ' : '';
        this.emitLine(0 + baseIndent, `${modifier}func ${source}(${parameterSourceStatement}`);

        this.emitCurlyBracketBegin(baseIndent);

        this.emitArgsDeclarationAndInstantiation(method);
        const executeMethod = method.returnType !== null ? 'executeFetch' : 'execute';
        const endpoint = this.resolveEndpoint(module.name);
        this.emitLine(
          2 + baseIndent,
          `jsExecutor.${executeMethod}(with: "${endpoint}", feature: "${method.name}", args: ${
            hasParam ? 'args' : 'nil'
          }, completion: completion)`
        );
        this.emitCurlyBracketEnd(baseIndent);
      });
      this.modulesSourceLines[module.name] = this.currentSourceLines;
    });

    this.renderCustomInterface();

    this.currentSourceLines = [] as SourceLike[];
  }

  print(): void {
    const modulesContent = this.getFormattedContentWithTemplate();
    Object.keys(modulesContent).forEach((moduleName) => {
      const content = modulesContent[moduleName];
      const moduleMeta = this.rendererConfig.modules[moduleName];
      fs.writeFileSync(path.join(this.outputPath, moduleMeta.fileName), content);
    });

    const { customInterfaceFileName } = this.rendererConfig;
    if (customInterfaceFileName && this.interfaceSourceLines.length > 0) {
      fs.writeFileSync(path.join(this.outputPath, customInterfaceFileName), this.interfaceSourceLines.join('\n'));
    }
    console.log('Generated api has been printed successfully');
  }
}
