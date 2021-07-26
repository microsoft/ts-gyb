import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as UUID } from 'uuid';
import { Parser } from '../src/parser/Parser';

export function withTempParser(sourceCode: string, handler: (parser: Parser) => void): void {
  const tempPath = fs.mkdtempSync(os.tmpdir());
  const filePath = path.join(tempPath, `${UUID()}.ts`);
  fs.writeFileSync(filePath, sourceCode);

  const parser = new Parser([filePath], new Set(), false);
  handler(parser);

  fs.rmdirSync(tempPath, { recursive: true });
}
