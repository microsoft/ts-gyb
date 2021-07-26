import { describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempMethodParser, withTempValueParser } from './utils';
import { ParserError } from '../src/parser/ParserError';
import { BasicType, BasicTypeValue, InterfaceType, OptionalType, TupleType, ValueType, ValueTypeKind } from '../src/types';

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

    it('Non-existent type', () => {
      withTempValueParser('NonExistentType', parseFunc => {
        expect(parseFunc).to.throw('reference type NonExistentType not found');
      });
    })

    it('Predefined type', () => {
      testValueType('predefined type', 'PredefinedType', { kind: ValueTypeKind.predefinedType, name: 'PredefinedType' }, new Set(['PredefinedType']));
    })
  });

  describe('Parse basic type', () => {
    testValueType('string', 'string', { kind: ValueTypeKind.basicType, value: BasicTypeValue.string });
    testValueType('number', 'number', { kind: ValueTypeKind.basicType, value: BasicTypeValue.number });
    testValueType('boolean', 'boolean', { kind: ValueTypeKind.basicType, value: BasicTypeValue.boolean });
  })

  describe('Parse InterfaceType', () => {
    const customTypesCode = `
    interface CustomType {}
    `;

    const emptyInterfaceType: InterfaceType = { kind: ValueTypeKind.interfaceType, name: 'CustomType', members: [], documentation: '', customTags: {} };
    testValueType('empty interface', 'CustomType', emptyInterfaceType, new Set(), customTypesCode);
  })

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

    const stringType: BasicType = { kind: ValueTypeKind.basicType, value: BasicTypeValue.string };
    const optionalStringType: OptionalType = { kind: ValueTypeKind.optionalType, wrappedType: stringType };

    testValueType('null union', 'string | null', optionalStringType);
    testValueType('undefined union', 'string | undefined', optionalStringType);
    testValueType('null and undefined union', 'string | null | undefined', optionalStringType);

    const numberType: BasicType = { kind: ValueTypeKind.basicType, value: BasicTypeValue.number };
    const tupleType: TupleType = { 
      kind: ValueTypeKind.tupleType, 
      members: [{ name: 'stringField', type: stringType, documentation: '' }, { name: 'numberField', type: numberType, documentation: '' }],
    };
    const optionalTupleType: OptionalType = { kind: ValueTypeKind.optionalType, wrappedType: tupleType };

    testValueType('merged tuple union', '{ stringField: string } | { numberField: number }', tupleType);
    testValueType('merged optional tuple union', '{ stringField: string } | { numberField: number } | null', optionalTupleType);
  });
});

function testValueType(name: string, valueTypeCode: string, type: ValueType, predefinedTypes: Set<string> = new Set(), customTypesCode: string = '') {
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
  }, predefinedTypes, customTypesCode);
}

