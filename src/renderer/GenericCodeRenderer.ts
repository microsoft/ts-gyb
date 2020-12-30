import { SourceLike } from './SourceLike';
import { RendererConfig } from './RenderConfig';

export abstract class GenericCodeRenderer {
  protected currentSourceLines: SourceLike[] = [];

  private typeLines: SourceLike[] = [];

  namespaces: string[] = [];

  constructor(protected rendererConfig: RendererConfig) {}

  public toSourceCode(): SourceLike[] {
    this.render();
    return this.currentSourceLines;
  }

  protected abstract render(): void;

  protected resolveEndpoint(moduleName: string): string {
    return this.rendererConfig.modules[moduleName].pathMap;
  }

  protected emitLine(indent: number, content: SourceLike): void {
    const indentString = ' '.repeat(indent);
    this.currentSourceLines.push(`${indentString}${content}`);
  }

  protected emitLines(indent: number, contents: SourceLike[]): void {
    contents.forEach((content) => this.emitLine(indent, content));
  }

  protected emitNewLine(): void {
    this.currentSourceLines.push('');
  }

  protected emitCurlyBracketBegin(indent = 0): void {
    this.emitLine(indent, '{');
  }

  protected emitCurlyBracketEnd(indent = 0): void {
    this.emitLine(indent, '}');
  }
}
