import sinon from 'sinon';
import { beforeEach, describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempParser } from './utils';
import { warnMessage } from '../src/logger/ParserLogger';

describe('Parser', () => {
  let stubWarn: sinon.SinonStub;
  beforeEach(() => {
    stubWarn = sinon.stub(console, 'warn');
  });

  describe('#methodFromNode()', () => {
    it('Unsupported method definition', () => {
      const sourceCode = `
      /**
      * @shouldExport true
      */
      interface MockedModule {
        invalidProperty: string;
      }
      `;

      withTempParser(sourceCode, (parser, filePath) => {
        parser.parse();
        const expectedWarning = warnMessage(`Skipped unsupported method definition "invalidProperty: string;" at ${filePath}:5. Please define only methods.`);

        expect(stubWarn.calledOnce).to.be.true;
        expect(stubWarn.calledWith(expectedWarning)).to.be.true;
      });
    });
  });
});
