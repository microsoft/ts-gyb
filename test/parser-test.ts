import { describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempParser } from './utils';
import { ValueParserError } from '../src/parser/ValueParserError';
import { BasicTypeValue, ValueTypeKind } from '../src/types';

describe('Parser', () => {
  it('shouldExport symbol', () => {
    const sourceCode = `
      /**
      * @shouldExport true
      */
      interface ExportTrueInterface {}

      /**
      * @shouldExport false
      */
      interface ExportFalseInterface {}

      interface NoExportInterface {}
      `;
    withTempParser(sourceCode, parser => {
      const modules = parser.parse();
      expect(modules).to.deep.equal([{
        name: 'ExportTrueInterface',
        members:[],
        methods: [],
        extendedInterfaces: [],
        documentation: '',
        customTags: {}
      }]);
    });
  });

  it('Two method syntax', () => {
    const sourceCode = `
      /**
      * @shouldExport true
      */
      interface MockedInterface {
        mockedMethod(): void;
        mockedFunctionProperty: () => void;
      }
      `;
    withTempParser(sourceCode, parser => {
      const modules = parser.parse();
      expect(modules).to.deep.equal([{
        name: 'MockedInterface', 
        members: [],
        methods: [{
          name: 'mockedMethod',
          parameters: [],
          returnType: null,
          isAsync: false,
          documentation: '',
        }, {
          name: 'mockedFunctionProperty',
          parameters: [],
          returnType: null,
          isAsync: false,
          documentation: '',
        }], 
        extendedInterfaces: [],
        documentation: '',
        customTags: {},
      }]);
    });
  });

  it('Module and method documentation', () => {
    const sourceCode = `
      /**
      * This is an example documentation for the module
      * @shouldExport true
      */
      interface MockedInterface {
        /**
        * This is an example documentation for the member
        */
        mockedMember: string;
        /**
        * This is an example documentation for the method
        */
        mockedMethod(): void;
      }
      `;

    withTempParser(sourceCode, parser => {
      const modules = parser.parse();
      expect(modules).to.deep.equal([{
        name: 'MockedInterface', 
        members: [{
          name: 'mockedMember',
          type: { kind: ValueTypeKind.basicType, value: BasicTypeValue.string },
          documentation: 'This is an example documentation for the member',
        }],
        methods: [{
          name: 'mockedMethod',
          parameters: [],
          returnType: null,
          isAsync: false,
          documentation: 'This is an example documentation for the method',
        }], 
        extendedInterfaces: [],
        documentation: 'This is an example documentation for the module',
        customTags: {},
      }]);
    });
  });

  it('Multiple parameters', () => {
    const sourceCode = `
      /**
      * @shouldExport true
      */
      interface MockedInterface {
        multipleParamsMethod(foo: string, bar: number);
      }
      `;

    withTempParser(sourceCode, parser => {
      expect(() => parser.parse()).to.throw(ValueParserError).with.property('message', 'it has multiple parameters');
    });
  });
});
