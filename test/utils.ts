import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as UUID } from 'uuid';
import { Parser } from '../src/parser/Parser';
import { Method } from '../src/types';

export function withTempParser(sourceCode: string, handler: (parser: Parser) => void): void {
  const tempPath = fs.mkdtempSync(os.tmpdir());
  const filePath = path.join(tempPath, `${UUID()}.ts`);
  fs.writeFileSync(filePath, sourceCode);

  const parser = new Parser([filePath], new Set(), false);
  handler(parser);

  fs.rmdirSync(tempPath, { recursive: true });
}

export function withTempMethodParser(methodCode: string, handler: (parseFunc: () => Method | null) => void): void {
  const sourceCode = `
    /**
    * @shouldExport true
    */
    interface MockedInterface {
      ${methodCode}
    }
    `;

  withTempParser(sourceCode, parser => {
    const parseFunc = () => {
      const module = parser.parse()[0];
      if (module.methods.length > 1) {
        throw Error('Multiple methods found');
      }

      return module.methods.length > 0 ? module.methods[0] : null;
    };

    handler(parseFunc);
  });
}
