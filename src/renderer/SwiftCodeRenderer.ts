import fs from 'fs';
import { Module } from '../types';
import { RendererConfig } from './RenderConfig';
import { InternalDataStructure } from './InternalDataStructure';
import { GenericCodeRenderer } from './GenericCodeRenderer';
import { TypeTransformer } from './CustomTypeCollector';

export class SwiftCodeRenderer extends GenericCodeRenderer {
  constructor(
    rendererConfig: RendererConfig,
    private typeTransformer: TypeTransformer,
    private parsedModules: Module[],
    private outputPath: string
  ) {
    super(rendererConfig);
  }

  render(): void {
    const apiModules = this.parsedModules;
    const { baseIndent } = this.rendererConfig;
    apiModules.forEach((module) => {
      this.namespaces.push(module.name);
      this.emitLine(0 + baseIndent, `// ${module.name}`);
      module.methods.forEach((method) => {
        const source = `${method.name}`;
        const parameterSources = method.parameters.map(
          (parameter) => `${parameter.name}: ${this.typeTransformer.transformType(parameter.type)}`
        );

        let returnTypeStatement: string;
        if (method.returnType !== null) {
          const returnTypeString = this.typeTransformer.transformType(method.returnType, true);

          returnTypeStatement = `@escaping (BridgeCompletion<${returnTypeString}?>)`;
        } else {
          returnTypeStatement = `BridgeJSExecutor.Completion? = nil`;
        }
        parameterSources.push(`completion: ${returnTypeStatement})`);
        const parameterSourceStatement = parameterSources.join(', ');

        const modifier = this.rendererConfig.makeFunctionPublic ? 'public ' : '';
        this.emitLine(0 + baseIndent, `${modifier}func ${source}(${parameterSourceStatement}`);

        this.emitCurlyBracketBegin(baseIndent);

        const hasParam = method.parameters.length > 0;
        if (hasParam) {
          const argSource = new InternalDataStructure(
            this.rendererConfig,
            'Args',
            this.typeTransformer,
            method.parameters
          ).toSourceCode();
          this.emitLines(2 + baseIndent, argSource);

          this.emitLine(2 + baseIndent, `let args = Args(`);
          method.parameters.forEach((param) => this.emitLine(4 + baseIndent, `${param.name}: ${param.name}`));
          this.emitLine(2 + baseIndent, `)`);
        }
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
    });

    if (this.rendererConfig.mergeCustomInterface) {
      this.emitLines(0 + baseIndent, this.typeTransformer.toSourceLike());
    }
  }

  print(): void {
    let content = this.toSourceCode().join('\n');
    if (this.rendererConfig.headerTemplate) {
      content = `${this.rendererConfig.headerTemplate}\n${content}`;
    }
    if (this.rendererConfig.footerTemplate) {
      content = `${content}\n${this.rendererConfig.footerTemplate}`;
    }
    fs.writeFileSync(this.outputPath, content);
    console.log('Generated api has been printed successfully');
  }
}
