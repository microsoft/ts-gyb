import dummyData from './data/parsedModules.json';
import { Module } from '../types';
import { RendererConfig } from '../renderer/RenderConfig';
import { InternalDataStructure } from '../renderer/InternalDataStructure';
import { GenericCodeRenderer } from '../renderer/GenericCodeRenderer';
import { TypeTransformer } from '../renderer/CustomTypeCollector';

export class ExampleCodeRenderer extends GenericCodeRenderer {
  constructor(rendererConfig: RendererConfig, private typeTransformer: TypeTransformer) {
    super(rendererConfig);
  }

  render(): void {
    const dummyDataTyped = dummyData as Module[];
    dummyDataTyped.forEach((module) => {
      this.namespaces.push(module.name);
      this.emitLine(0, `// ${module.name}`);
      module.methods.forEach((method) => {
        const source = `${method.name}`;
        const parameterSources = method.parameters.map(
          (parameter) => `${parameter.name}: ${this.typeTransformer.transformType(parameter.type)}`
        );

        let returnTypeStatement: string;
        if (method.returnType !== null) {
          const returnTypeString = this.typeTransformer.transformType(method.returnType, true);
          returnTypeStatement = `@escaping (BridgeCompletion<${returnTypeString}?>)? = nil`;
        } else {
          returnTypeStatement = `BridgeJSExecutor.Completion? = nil`;
        }
        parameterSources.push(`completion: ${returnTypeStatement})`);
        const parameterSourceStatement = parameterSources.join(', ');

        this.emitLine(0, `func ${source}(${parameterSourceStatement}`);

        this.emitCurlyBracketBegin();

        const hasParam = method.parameters.length > 0;
        if (hasParam) {
          const argSource = new InternalDataStructure(
            this.rendererConfig,
            'Args',
            this.typeTransformer,
            method.parameters
          ).toSourceCode();
          this.emitLines(2, argSource);

          this.emitLine(2, `let args = Args(`);
          method.parameters.forEach((param) => this.emitLine(4, `${param.name}: ${param.name}`));
          this.emitLine(2, `)`);
        }
        const executeMethod = method.returnType !== null ? 'executeFetch' : 'execute';
        const endpoint = this.resolveEndpoint(module.name);
        this.emitLine(
          2,
          `jsExecutor.${executeMethod}(with: "${endpoint}", feature: "${method.name}", args: ${
            hasParam ? 'args' : 'nil'
          }, completion: completion)`
        );
        this.emitCurlyBracketEnd();
      });
    });
  }

  print(): void {
    console.log(this.toSourceCode().join('\n'));
  }
}
