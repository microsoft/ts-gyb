import { describe, it } from 'mocha';
import { expect } from 'chai';
import { withTempMethodParser, withTempValueParser } from './utils';
import { ValueParserError } from '../src/parser/ValueParserError';
import { BasicType, BasicTypeValue, DictionaryKeyType, DictionaryType, EnumSubType, EnumType, InterfaceType, OptionalType, PredefinedType, TupleType, ValueType, ValueTypeKind, UnionType } from '../src/types';
import { UnionTypeView } from '../src/renderer/views';
import { SwiftValueTransformer } from '../src/renderer/value-transformer';

const stringType: BasicType = { kind: ValueTypeKind.basicType, value: BasicTypeValue.string };
const numberType: BasicType = { kind: ValueTypeKind.basicType, value: BasicTypeValue.number };
const booleanType: BasicType = { kind: ValueTypeKind.basicType, value: BasicTypeValue.boolean };

describe('ValueParser', () => {
  describe('Return types', () => {
    it('Empty return', () => {
      const methodCode = 'mockedMethod();';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc).to.throw(ValueParserError).with.property('message', 'no return type provided');
      })
    });

    it('Return void', () => {
      const methodCode = 'mockedMethod(): void;';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc()).to.deep.equal({ name: 'mockedMethod', parameters: [], returnType: null, isAsync: false, documentation: '', });
      })
    });

    it('Return promise void', () => {
      const methodCode = 'mockedMethod(): Promise<void>;';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc()).to.deep.equal({ name: 'mockedMethod', parameters: [], returnType: null, isAsync: true, documentation: '', });
      })
    });

    it('Return type', () => {
      let customTypesCode = `
      export interface SelectionRect {
        start: number;
      }
      `
      const methodCode = `
      mockedMethod(): SelectionRect;
      `;
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc()).to.deep.equal({
          name: 'mockedMethod',
          parameters: [],
          returnType: {
            name: 'SelectionRect',
            customTags: {},
            methods: [],
            documentation: '',
            kind: 'interfaceType',
            members: [
              {
                documentation: '',
                name: 'start',
                type: {
                  kind: 'basicType',
                  value: 'number',
                },
              },
            ],
          },
          isAsync: false,
          documentation: '',
        });
      }, new Set(), customTypesCode)
    });
  });

  describe('Parameters type', () => {
    it('Invalid parameters type', () => {
      const methodCode = 'mockedMethod(invalidArgs: string);';
      withTempMethodParser(methodCode, parseFunc => {
        expect(parseFunc).to.throw(ValueParserError).with.property('message', 'parameters type string is not supported');
      });
    });
  });

  describe('Value types', () => {
    it('Not supported type', () => {
      withTempValueParser('void', parseFunc => {
        expect(parseFunc).to.throw('type void is not supported');
      });
    });

    it('Non-existent type', () => {
      withTempValueParser('NonExistentType', parseFunc => {
        expect(parseFunc).to.throw('reference type NonExistentType not found');
      });
    })

    testValueType('predefined type', 'PredefinedType', { kind: ValueTypeKind.predefinedType, name: 'PredefinedType' }, new Set(['PredefinedType']));
  });

  describe('Parse basic type', () => {
    testValueType('string', 'string', { kind: ValueTypeKind.basicType, value: BasicTypeValue.string });
    testValueType('number', 'number', { kind: ValueTypeKind.basicType, value: BasicTypeValue.number });
    testValueType('boolean', 'boolean', { kind: ValueTypeKind.basicType, value: BasicTypeValue.boolean });
  })

  describe('Parse InterfaceType', () => {
    const interfacesCode = `
    interface EmptyInterface {}

    interface InterfaceWithMembers {
      stringMember: string;
      numberMember: number;
    }

    interface ExtendedInterface extends InterfaceWithMembers {
      booleanMember: boolean;
    }

    interface DictionaryInterface {
      [key: string]: string;
    }

    interface InterfaceWithNeverMember {
      stringMember: string;
      neverMember: never;
    }

    interface ExtendedInterfaceWithNeverMember extends InterfaceWithMembers {
      numberMember: never;
    }

    interface RecursiveInterface {
      self: RecursiveInterface;
    }
    `;

    const emptyInterfaceType: InterfaceType = { kind: ValueTypeKind.interfaceType, name: 'EmptyInterface', members: [], methods: [], documentation: '', customTags: {} };
    testValueType('empty interface', 'EmptyInterface', emptyInterfaceType, new Set(), interfacesCode);

    const interfaceWithMembersType: InterfaceType = {
      kind: ValueTypeKind.interfaceType,
      name: 'InterfaceWithMembers',
      members: [
        { name: 'stringMember', type: stringType, documentation: '' },
        { name: 'numberMember', type: numberType, documentation: '' },
      ],
      methods: [],
      documentation: '',
      customTags: {},
    };
    testValueType('interface with members', 'InterfaceWithMembers', interfaceWithMembersType, new Set(), interfacesCode);

    const extendedInterfaceType: InterfaceType = {
      kind: ValueTypeKind.interfaceType,
      name: 'ExtendedInterface',
      members: [
        { name: 'booleanMember', type: booleanType, documentation: '' },
        { name: 'stringMember', type: stringType, documentation: '' },
        { name: 'numberMember', type: numberType, documentation: '' },
      ],
      methods: [],
      documentation: '',
      customTags: {},
    };
    testValueType('extended interface', 'ExtendedInterface', extendedInterfaceType, new Set(), interfacesCode);

    const interfaceWithNeverMemberType: InterfaceType = {
      kind: ValueTypeKind.interfaceType,
      name: 'InterfaceWithNeverMember',
      members: [
        { name: 'stringMember', type: stringType, documentation: '' },
      ],
      methods: [],
      documentation: '',
      customTags: {},
    };
    testValueType('interface with never member', 'InterfaceWithNeverMember', interfaceWithNeverMemberType, new Set(), interfacesCode);

    const extendedInterfaceWithNeverMemberType: InterfaceType = {
      kind: ValueTypeKind.interfaceType,
      name: 'ExtendedInterfaceWithNeverMember',
      members: [
        { name: 'stringMember', type: stringType, documentation: '' },
      ],
      methods: [],
      documentation: '',
      customTags: {},
    };
    testValueType('extended interface with never member', 'ExtendedInterfaceWithNeverMember', extendedInterfaceWithNeverMemberType, new Set(), interfacesCode);

    // TODO: Recursive interface is not handled yet
    // const recursiveInterfaceType: InterfaceType = {
    //   kind: ValueTypeKind.interfaceType,
    //   name: 'RecursiveInterface',
    //   members: [
    //     { name: 'self', type: { kind: ValueTypeKind.predefinedType, name: 'RecursiveInterface' }, documentation: '' },
    //   ],
    //   documentation: '',
    //   customTags: {},
    // };
    // testValueType('recursive interface', 'RecursiveInterface', recursiveInterfaceType, new Set(), interfacesCode);
  })
  
  describe('Parse tuple type', () => {
    const emptyTupleType: TupleType = { kind: ValueTypeKind.tupleType, members: [] };
    testValueType('empty tuple', '{}', emptyTupleType);

    const tupleWithMembersType: TupleType = { 
      kind: ValueTypeKind.tupleType, 
      members: [{ name: 'stringField', type: stringType, documentation: '' }, { name: 'numberField', type: numberType, documentation: '' }],
    };
    testValueType('tuple with members', '{ stringField: string, numberField: number }', tupleWithMembersType);
    testValueType('merged tuple', '{ stringField: string } | { numberField: number }', tupleWithMembersType);

    const interfacesCode = `
    interface InterfaceWithStringField {
      stringField: string;
    }

    interface InterfaceWithNumberField {
      numberField: number;
    }
    `;
    testValueType('merged interface and tuple', 'InterfaceWithStringField | { numberField: number }', tupleWithMembersType, new Set(), interfacesCode);
  })

  describe('Parse enum type', () => {
    const enumsCode = `
    enum EmptyEnum {}

    enum DefaultEnum {
      a,
      b,
    }

    enum StringEnum {
      firstCase = 'firstCase',
      secondCase = 'secondCase',
    }

    enum NumberEnum {
      one = 1,
      two = 2,
    }

    enum InvalidEnum {
      firstCase = 'firstCase',
      two = 2,
    }
    `;

    const emptyEnumType: EnumType = { kind: ValueTypeKind.enumType, name: 'EmptyEnum', subType: EnumSubType.string, members: [], documentation: '', customTags: {} };
    testValueType('empty enum', 'EmptyEnum', emptyEnumType, new Set(), enumsCode);

    const defaultEnumType: EnumType = {
      kind: ValueTypeKind.enumType,
      name: 'DefaultEnum',
      subType: EnumSubType.number,
      members: [
        { key: 'a', value: 0, documentation: '' },
        { key: 'b', value: 1, documentation: '' },
      ],
      documentation: '',
      customTags: {},
    }
    testValueType('default enum', 'DefaultEnum', defaultEnumType, new Set(), enumsCode);

    const stringEnumType: EnumType = {
      kind: ValueTypeKind.enumType,
      name: 'StringEnum',
      subType: EnumSubType.string,
      members: [
        { key: 'firstCase', value: 'firstCase', documentation: '' },
        { key: 'secondCase', value: 'secondCase', documentation: '' },
      ],
      documentation: '',
      customTags: {},
    }
    testValueType('string enum', 'StringEnum', stringEnumType, new Set(), enumsCode);
    
    const numberEnumType: EnumType = {
      kind: ValueTypeKind.enumType,
      name: 'NumberEnum',
      subType: EnumSubType.number,
      members: [
        { key: 'one', value: 1, documentation: '' },
        { key: 'two', value: 2, documentation: '' },
      ],
      documentation: '',
      customTags: {},
    }
    testValueType('number enum', 'NumberEnum', numberEnumType, new Set(), enumsCode);

    it('Invalid enum', () => {
      withTempValueParser('InvalidEnum', parseFunc => {
        expect(parseFunc).to.throw('enum InvalidEnum is invalid because enums with multiple subtypes are not supported.');
      }, new Set(), enumsCode);
    });
  });

  describe('Parse array type', () => {
    testValueType('string array', 'string[]', { kind: ValueTypeKind.arrayType, elementType: stringType });
    testValueType('number array', 'number[]', { kind: ValueTypeKind.arrayType, elementType: numberType });
    testValueType('generic defined array', 'Array<string>', { kind: ValueTypeKind.arrayType, elementType: stringType });
  });

  describe('Parse dictionary type', () => {
    const stringDictionaryType: DictionaryType = { kind: ValueTypeKind.dictionaryType, keyType: DictionaryKeyType.string, valueType: stringType };
    testValueType('string dictionary', '{ [key: string]: string }', stringDictionaryType);
    testValueType('record string dictionary', 'Record<string, string>', stringDictionaryType);
    testValueType('map string dictionary', 'Map<string, string>', stringDictionaryType);

    const numberDictionaryType: DictionaryType = { kind: ValueTypeKind.dictionaryType, keyType: DictionaryKeyType.number, valueType: booleanType };
    testValueType('number dictionary', '{ [key: number]: boolean }', numberDictionaryType);
    testValueType('record number dictionary', 'Record<number, boolean>', numberDictionaryType);
    testValueType('map number dictionary', 'Map<number, boolean>', numberDictionaryType);
    
    const dictionaryCode = `
    interface DictionaryInterface {
      [key: string]: number;
    }
    `;

    testValueType('string interface dictionary', 'DictionaryInterface', { kind: ValueTypeKind.dictionaryType, keyType: DictionaryKeyType.string, valueType: numberType }, new Set(), dictionaryCode);
  });

  describe('Parse union type', () => {
    it('Empty types union', () => {
      const valueTypeCode = 'null | undefined';
      withTempValueParser(valueTypeCode, parseFunc => {
        expect(parseFunc).to.throw('type null | undefined is invalid');
      });
    });
    const customCode = `
    interface Person {
      name: string;
    }
    `;

    let unionType: UnionType = {
      customTags: {},
      name: '',
      kind: ValueTypeKind.unionType,
      members: [
        {
          kind: ValueTypeKind.basicType,
          value: BasicTypeValue.string,
        },
        {
          kind: ValueTypeKind.basicType,
          value: BasicTypeValue.number,
        },
        {
          keyType: DictionaryKeyType.string,
          kind: ValueTypeKind.dictionaryType,
          valueType: {
            kind: ValueTypeKind.basicType,
            value: BasicTypeValue.string,
          }
        },
        {
          elementType: {
            kind: ValueTypeKind.basicType,
            value: BasicTypeValue.string,
          },
          kind: ValueTypeKind.arrayType
        },
        {
          customTags: {},
          documentation: "",
          kind: ValueTypeKind.interfaceType,
          members: [
            {
              documentation: "",
              name: "name",
              type: {
                "kind": ValueTypeKind.basicType,
                "value": BasicTypeValue.string,
              }
            }
          ],
          methods: [],
          name: "Person",
        },
      ],
    };
    testValueType('Multiple types union', 'string | number | Record<string, string> | string[] | Person', unionType, new Set(), customCode);

    const sortedMembers = new UnionTypeView(unionType, new SwiftValueTransformer({})).members;
    expect(sortedMembers).to.deep.equal([
      {
        capitalizeName: 'StringArray',
        uncapitalizeName: 'stringArray',
        type: '[String]',
        first: true,
        last: false
      },
      {
        capitalizeName: 'Person',
        uncapitalizeName: 'person',
        type: 'Person',
        first: false,
        last: false
      },
      {
        capitalizeName: 'StringForStringDictionary',
        uncapitalizeName: 'stringForStringDictionary',
        type: '[String: String]',
        first: false,
        last: false
      },
      {
        capitalizeName: 'Double',
        uncapitalizeName: 'double',
        type: 'Double',
        first: false,
        last: false
      },
      {
        capitalizeName: 'String',
        uncapitalizeName: 'string',
        type: 'String',
        first: false,
        last: true
      },
    ]);
  });

  describe('Parse alias type', () => {
    const aliasTypesCode = `
    interface ExampleInterface {
      foobar: string;
    }

    type str = string;
    type secondStr = str;
    type CodeGenStr = string & { _intBrand: never };
    type AliasInterface = ExampleInterface;
    type AliasDefinedInterface = {
      foobar: string,
    };
    `;

    const predefinedStringType: PredefinedType = { kind: ValueTypeKind.predefinedType, name: 'CodeGenStr' };
    const aliasInterfaceType: InterfaceType = {
      kind: ValueTypeKind.interfaceType,
      name: 'ExampleInterface',
      members: [
        { name: 'foobar', type: stringType, documentation: '' },
      ],
      methods: [],
      documentation: '',
      customTags: {},
    };
    const aliasDefinedInterfaceType: InterfaceType = {
      kind: ValueTypeKind.interfaceType,
      name: 'AliasDefinedInterface',
      members: [
        { name: 'foobar', type: stringType, documentation: '' },
      ],
      methods: [],
      documentation: '',
      customTags: {},
    };

    testValueType('string alias', 'str', stringType, new Set(), aliasTypesCode);
    testValueType('alias of string alias', 'secondStr', stringType, new Set(), aliasTypesCode);
    testValueType('predefined string alias', 'CodeGenStr', predefinedStringType, new Set(['CodeGenStr']), aliasTypesCode);
    testValueType('alias interface', 'AliasInterface', aliasInterfaceType, new Set(), aliasTypesCode);
    testValueType('alias defined interface', 'AliasDefinedInterface', aliasDefinedInterfaceType, new Set(), aliasTypesCode);
  });
});

function testValueType(name: string, valueTypeCode: string, type: ValueType, predefinedTypes: Set<string> = new Set(), customTypesCode: string = '') {
  it(`Return ${name}`, () => {
    withTempValueParser(valueTypeCode, parseFunc => {
      const valueType = parseFunc();
      expect(valueType.return).to.deep.equal(type);
    }, predefinedTypes, customTypesCode);
  })

  it(`Return promise ${name}`, () => {
    withTempValueParser(valueTypeCode, parseFunc => {
      const valueType = parseFunc();
      expect(valueType.promiseReturn).to.deep.equal(type);
    }, predefinedTypes, customTypesCode);
  })

  it(`Parameter type ${name}`, () => {
    withTempValueParser(valueTypeCode, parseFunc => {
      const valueType = parseFunc();
      expect(valueType.parameter).to.deep.equal(type);
    }, predefinedTypes, customTypesCode);
  })
}

