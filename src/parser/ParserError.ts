import ts from 'typescript';

export class ParserError extends Error {
  constructor(public node: ts.Node, public reason: string, public guide: string) {
    super(`${reason}. ${guide}`);
  }
}
