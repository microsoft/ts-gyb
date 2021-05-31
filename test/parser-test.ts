import { describe, it } from 'mocha';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { withTempParser } from './utils';
import { warnMessage } from '../src/logger/ParserLogger';

chai.use(sinonChai);

describe('Parser', () => {
  it('shouldExport symbol', () => {
    const exportedTrueSourceCode = `
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
    withTempParser(exportedTrueSourceCode, parser => {
      const modules = parser.parse();
      expect(modules).to.deep.equal([{name: 'ExportTrueInterface', methods: [], documentation: ''}]);
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
        * This is an example documentation for the method
        */
        mockedMethod(): void;
      }
      `;

    withTempParser(sourceCode, parser => {
      const modules = parser.parse();
      expect(modules).to.deep.equal([{
        name: 'MockedInterface', 
        methods: [{
          name: 'mockedMethod',
          parameters: [],
          returnType: null,
          documentation: 'This is an example documentation for the method',
        }], 
        documentation: 'This is an example documentation for the module'
      }]);
    });
  });

  it('Unsupported method definition', () => {
    const sourceCode = `
      /**
      * @shouldExport true
      */
      interface MockedInterface {
        invalidProperty: string;
      }
      `;

    withTempParser(sourceCode, (parser, filePath) => {
      const stubWarn = sinon.stub(console, 'warn');

      const modules = parser.parse();
      expect(modules).to.deep.equal([{name: 'MockedInterface', methods: [], documentation: ''}]);

      const expectedWarning = warnMessage(`Skipped "invalidProperty: string;" at ${filePath}:5 because it is not valid method signature. Please define only methods.`);
      expect(stubWarn).to.have.been.calledWith(expectedWarning);

      stubWarn.restore();
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

    withTempParser(sourceCode, (parser, filePath) => {
      const stubWarn = sinon.stub(console, 'warn');

      const modules = parser.parse();
      expect(modules).to.deep.equal([{name: 'MockedInterface', methods: [], documentation: ''}]);

      const expectedWarning = warnMessage(`Skipped "multipleParamsMethod(foo: string, bar: number);" at ${filePath}:5 because it has multiple parameters. Methods should only have one property. Please use destructuring object for multiple parameters.`);
      expect(stubWarn).to.have.been.calledWith(expectedWarning);

      stubWarn.restore();
    });
  });
});
