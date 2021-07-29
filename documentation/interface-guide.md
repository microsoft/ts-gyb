# TypeScript Interface Guide

## Method definition

ts-codegen only recognizes interface members defined as methods.

```typescript
/**
 * @shouldExport true
 */
interface ModuleName {
  // allowed: method
  thisIsAMethod(): void;

  // not allowed: function property
  thisIsAProperty: () => void;
}
```

> Tips: TypeScript allows you to implement a method in an interface as a function property. This requirement does not prevent you from using arrow functions in the implementation of the interface.

## Parameters

To take in parameters, define an object argument in the method. The type can either be an interface or an object literal.

```typescript
/**
 * @shouldExport true
 */
interface ModuleName {
  // allowed: interface MethodWithInterfaceArgs
  methodWithInterface(args: MethodWithInterfaceArgs): void;

  // allowed: object literal
  methodWithObjectLiteralArgs(args: { text: string, digits: number }): void;

  // allowed: destructuring assignment
  methodWithDestructuring({ text, digits }: { text: string, digits: number }): void;

  // not allowed: multiple arguments
  methodWithMultiArgs(text: string, digits: number): void;

  // not allowed: not an object
  methodWithNonObject(text: string): void;
}
```

Refer to [Value types](#value-types) for allowed parameter types.

> Tips: If your existing method uses multiple arguments, changing to destructuring assignment would be easier since no change is needed to the method body.

## Return type

Return type must be explicitly specified. When not provided, TypeScript would use `any` which is not supported by ts-codegen. Use `void` when the method does not return a value.

Return type can be a `Promise`.

Refer to [Value types](#value-types) for allowed types as return type.

## Value types

### Basic types

- `string`
- `number`
- `boolean`

> Tips: TypeScript does not distinguish integer from float point number, and ts-codegen would map `number` to the default float point type in the target language. To map a value to integer, refer to the guide in [Integer type](#integer-type).

### `interface` and object literal

#### Members

Only value properties are valid. Methods and function properties would be ignored. The type of the property can be any type specified in [Value types](#value-types).

#### Extension

When an interface extends another interface, all members of the parent interface would be merged with the members.

#### Indexable types

When an interface or an object literal contains an index member, it would be parsed as [index signature](https://www.typescriptlang.org/docs/handbook/2/objects.html#index-signatures) and be mapped to dictionary. ts-codegen only recognizes indexable types with only one index member. Currently the index type can only be `string`. The type of the value can be any type specified in [Value types](#value-types).

```typescript
// allowed: indexable interface
interface StringKeyDictionary {
  [key: string]: number;
}

// allowed: indexable object literal
{ [key: string]: number }

// not allowed: more than one member.
interface InvalidDictionary {
  [key: string]: number;

  otherMember: number;
}
```

### `enum`

Only [Numeric enum](https://www.typescriptlang.org/docs/handbook/enums.html#numeric-enums) and [String enum](https://www.typescriptlang.org/docs/handbook/enums.html#string-enums) are supported. Using a [Heterogeneous enum](https://www.typescriptlang.org/docs/handbook/enums.html#heterogeneous-enums) would result an error.

```typescript
// allowed: numeric enum
enum NumericEnum {
  one = 1,
  two = 2,
}

// allowed: default to numeric enum
enum DefaultEnum {
  zero,
  one,
}

// allowed: string enum
enum StringEnum {
  firstCase = 'FIRSTCASE',
  secondCase = 'SECONDCASE',
}

// not allowed: heterogeneous enum
enum InvalidEnum {
  no = 0,
  yes = 'YES',
}
```

### Array type

Arries defined like `string[]` are supported. The element can be any type specified in [Value types](#value-types).

### Union type

The support for union types is limited. Only these scenrios are supported:

- Any supported value type union with `null` or/and `undefined` to specify optional type
- Union two interfaces or object literals to a new object literal
- Combination of the above two cases

Any other union types would result in an error.

```typescript
// allowed: optional
string | null
string | undefined
string | null | undefined

interface StringFieldInterface {
  stringField: string;
}
interface NumberFieldInterface {
  numberField: number;
}

// allowed: interface and object literal
// All 3 definitions are equivalent to { stringField: string, numberField: number }
{ stringField: string } | { numberField: number }
StringFieldInterface | { numberField: number }
StringFieldInterface | NumberFieldInterface

// not allowed: unsupported union
string | number
{ stringField: string } | number
```

### Type alias

TypeScript [Type alias](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-aliases) is supported. The target type can be any type specified in [Value types](#value-types). Alias types would be parsed as its target type, and the alias name would be discarded, with only one exception -- object literal. Aliased object literal would be treated as an `interface`.

```typescript
// equivalent to string
type str = string;

// still equivalent to string
type aliasedStr = str;

// equivalent to FoobarInterface and name AliasedInterface would not be used
type AliasedInterface = FoobarInterface

// would be an interface. equivalent to interface AliasDefinedInterface { stringField: string }
type AliasDefinedInterface = { stringField: string }
```

### Predefined type

You can define some types as predefined. ts-codegen would treat these as known types and would assume they exist in the generated code. You must ensure these types can be correctly referenced in your project when using generated code.

This is helpful for working around types that not supported by TypeScript or ts-codegen. [Workarounds](#workarounds) section introduces some use cases for this type.

Refer to [Predefined type configuration](configuration-reference.md#predefined-type) for how to configure predefined types.

## Tags

## Documentation

## Workarounds

### Integer type

### Unsupported type

