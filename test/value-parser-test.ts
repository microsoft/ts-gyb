import { describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempParser } from './utils';
import { ParserError } from '../src/parser/ParserError';

describe('ValueParser', () => {
  it('Invalid parameters type', () => {
    const exportedTrueSourceCode = `
      /**
      * @shouldExport true
      */
      interface MockedInterface {
        mockedMethod(invalidArgs: string);
      }
      `;
    withTempParser(exportedTrueSourceCode, parser => {
      expect(() => parser.parse()).to.throw(ParserError).with.property('reason', 'parameters error: parameters type is not supported');
    });
  });
});
