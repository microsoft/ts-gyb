import { describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempMethodParser } from './utils';
import { ParserError } from '../src/parser/ParserError';

describe('ValueParser', () => {
  describe('return types', () => {
    it('return void', () => {
      const methodCode = 'mockedMethod(): void;';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc()).to.deep.equal({ name: 'mockedMethod', parameters: [], returnType: null, documentation: '', });
      })
    });
  });

  describe('parameters type', () => {
    it('Invalid parameters type', () => {
      const methodCode = 'mockedMethod(invalidArgs: string);';
      withTempMethodParser(methodCode, parseFunc => {
        expect(() => parseFunc()).to.throw(ParserError).with.property('reason', 'parameters error: parameters type string is not supported');
      });
    });
  });
});
