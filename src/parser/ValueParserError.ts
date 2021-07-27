export class ValueParserError extends Error {
  constructor(public message: string, public guide: string) {
    super(message);
  }
}
