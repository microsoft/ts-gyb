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

> TypeScript allows you to implement a method in an interface as a function property. This requirement does not prevent you from using arrow functions in the implementation of the interface.

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

> If your existing method uses multiple arguments, changing to destructuring assignment would be easier since no change is needed to the method body.

## Return type

Return type must be explicitly specified. When not provided, TypeScript would use `any` which is not supported by ts-codegen. Use `void` when the method does not return a value.

Return type can be a `Promise`.

Refer to [Value types](#value-types) for allowed types as return type.

## Value types

### Basic types

- `string`
- `number`
- `boolean`

> TypeScript does not distinguish integer from float point number, and ts-codegen would map `number` to the default float point type in the target language. To map a value to integer, use [Predefined type](#predefined-type).

### `interface` and object literal

#### Members

Only value properties are valid. Methods and function properties would be ignored. The type of the property can be any type specified in [Value types](#value-types).

#### Extension

When an interface extends another interface, all members of the parent interface would be merged with the members.

#### Indexable types

When an interface or an object literal contains an index member, it would be parsed as [Indexable types](https://www.typescriptlang.org/docs/handbook/interfaces.html#indexable-types) and be mapped to dictionary. ts-codegen only recognizes indexable types with only one index member. Currently the index type can only be `string`. The type of the value can be any type specified in [Value types](#value-types).

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

### Alias type



### Predefined type

## Tags

## Documentation
