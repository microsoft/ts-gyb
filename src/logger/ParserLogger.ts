import ts from 'typescript';
import chalk from 'chalk';

export function warnMessage(message: string): string {
  return chalk.yellowBright(message);
}

export class ParserLogger {
  constructor(
    private checker: ts.TypeChecker,
  ) {}

  warn(message: string): void {
    console.warn(warnMessage(message));
  }

  warnSkippedNode(node: ts.Node, reason: string, guide: string): void {
    this.warn(`Skipped "${node.getText()}" at ${this.getFileNameAndLine(node)} because ${reason}. ${guide}.`);
  }

  private getFileNameAndLine(node: ts.Node): string {
    const { line } = ts.getLineAndCharacterOfPosition(
      node.getSourceFile(),
      node.pos
    );

    return `${node.getSourceFile().fileName}:${line + 1}`;
  }
}
