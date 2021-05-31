import ts from 'typescript';
import chalk from 'chalk';

export function warnMessage(message: string): string {
  return chalk.yellowBright(message);
}

export class ParserLogger {
  constructor(
    private checker: ts.TypeChecker,
  ) {}

  logSkippedNode(node: ts.Node, nodeDescription: string, guide: string): void {
    const { line } = ts.getLineAndCharacterOfPosition(
      node.getSourceFile(),
      node.pos
    );

    console.warn(warnMessage(`Skipped ${nodeDescription} "${node.getText()}" at ${node.getSourceFile().fileName}:${line + 1}. ${guide}.`));
  }
}
