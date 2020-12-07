import { SourceLike } from './SourceLike';
import { RendererConfig } from './RenderConfig';

export abstract class GenericCodeRenderer {
  private sourceLines: SourceLike[] = [];

  private typeLines: SourceLike[] = [];

  namespaces: string[] = [];

  constructor(protected rendererConfig: RendererConfig) {}

  public toSourceCode(): SourceLike[] {
    this.render();
    return this.sourceLines;
  }

  protected abstract render(): void;

  protected resolveEndpoint(moduleName: string): string {
    return this.rendererConfig.pathMap[moduleName];
  }

  protected emitLine(indent: number, content: SourceLike): void {
    const indentString = ' '.repeat(indent);
    this.sourceLines.push(`${indentString}${content}`);
  }

  protected emitLines(indent: number, contents: SourceLike[]): void {
    contents.forEach((content) => this.emitLine(indent, content));
  }

  protected emitNewLine(): void {
    this.sourceLines.push('');
  }

  protected emitCurlyBracketBegin(indent = 0): void {
    this.emitLine(indent, '{');
  }

  protected emitCurlyBracketEnd(indent = 0): void {
    this.emitLine(indent, '}');
  }
}
