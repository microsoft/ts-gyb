import { describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempMethodParser, withTempValueParser } from './utils';
import { ParserError } from '../src/parser/ParserError';
import { BasicTypeValue, OptionalType, ValueType, ValueTypeKind } from '../src/types';

describe('ValueParser', () => {
  describe('Return types', () => {
    it('Empty return', () => {
      const methodCode = 'mockedMethod();';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc).to.throw(ParserError).with.property('reason', 'return type error: no return type provided');
      })
    });

    it('Return void', () => {
      const methodCode = 'mockedMethod(): void;';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc()).to.deep.equal({ name: 'mockedMethod', parameters: [], returnType: null, documentation: '', });
      })
    });

    it('Return promise void', () => {
      const methodCode = 'mockedMethod(): Promise<void>;';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc()).to.deep.equal({ name: 'mockedMethod', parameters: [], returnType: null, documentation: '', });
      })
    });
  });

  describe('Parameters type', () => {
    it('Invalid parameters type', () => {
      const methodCode = 'mockedMethod(invalidArgs: string);';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc).to.throw(ParserError).with.property('reason', 'parameters error: parameters type string is not supported');
      });
    });
  });

  describe('Value types', () => {
    it('Not supported type', () => {
      const valueTypeCode = 'void';
      withTempValueParser(valueTypeCode, parseFunc => {
        expect(parseFunc).to.throw('type void is not supported');
      });
    });
  });

  describe('Parse union type', () => {
    it('Empty types union', () => {
      const valueTypeCode = 'null | undefined';
      withTempValueParser(valueTypeCode, parseFunc => {
        expect(parseFunc).to.throw('union type null | undefined is invalid');
      });
    })

    it('Multiple types union', () => {
      const valueTypeCode = 'string | number';
      withTempValueParser(valueTypeCode, parseFunc => {
        expect(parseFunc).to.throw('union type string | number is invalid');
      });
    });

    const optionalString: OptionalType = { kind: ValueTypeKind.optionalType, wrappedType: { kind: ValueTypeKind.basicType, value: BasicTypeValue.string } };

    testValueType('null union', 'string | null', optionalString);
    testValueType('undefined union', 'string | undefined', optionalString);
    testValueType('null and undefined union', 'string | null | undefined', optionalString);
  });
});

function testValueType(name: string, valueTypeCode: string, type: ValueType) {
  withTempValueParser(valueTypeCode, parseFunc => {
    const valueType = parseFunc();

    it(`Return ${name}`, () => {
      expect(valueType.return).to.deep.equal(type);
    })

    it(`Return promise ${name}`, () => {
      expect(valueType.promiseReturn).to.deep.equal(type);
    })

    it(`Parameter type ${name}`, () => {
      expect(valueType.parameter).to.deep.equal(type);
    })
  });
}

