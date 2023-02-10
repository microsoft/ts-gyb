[ts-gyb](../README.md) / [Exports](../modules.md) / ParseConfiguration

# Interface: ParseConfiguration

Parser configuration

## Table of contents

### Properties

- [defaultCustomTags](ParseConfiguration.md#defaultcustomtags)
- [dropInterfaceIPrefix](ParseConfiguration.md#dropinterfaceiprefix)
- [predefinedTypes](ParseConfiguration.md#predefinedtypes)
- [skipInvalidMethods](ParseConfiguration.md#skipinvalidmethods)
- [source](ParseConfiguration.md#source)

## Properties

### defaultCustomTags

• `Optional` **defaultCustomTags**: `Record`<`string`, `unknown`\>

Custom tags for code generation in mustache and its default value.

___

### dropInterfaceIPrefix

• `Optional` **dropInterfaceIPrefix**: `boolean`

Drop the `I` prefix for TypeScript interfaces.
This only works for types used as method parameters or return value.

___

### predefinedTypes

• `Optional` **predefinedTypes**: `string`[]

Names for pre-defined types.
For example, `CodeGen_Int` for mapping for `number` to integers.

___

### skipInvalidMethods

• `Optional` **skipInvalidMethods**: `boolean`

Skip the code generation for invalid methods. If `false`, the code generation will fail when encounter an unsupported type.

___

### targets

• **targets**: `Record<string, {"source", "exportedInterfaceBases", "tsconfigPath"}>`

Describe the target interfaces to be parsed, the key is the name of the target, and the value is an object including the below properties:

#### source

• **source**: `string[]`

Scoped source file paths. The array of the source file paths for one target. [Glob patterns](https://en.wikipedia.org/wiki/Glob_(programming)) are allowed.
If it is a relative path, it will be resolved based on the configuration file path.

For example, `["src/api/IEditor.ts", "src/bridge/*.ts"]`

#### exportedInterfaceBases

• `Optional` **exportedInterfaceBases**: `string`[]

Interface names for detecting exported modules. If defined, only interfaces that extends the specified interfaces will be parsed.
If not defined, interfaces with JSDoc tag `@shouldExport true` would be parsed.
For example, set it to `["ExportedInterface"]`, all such interfaces would be exported:
```ts
interface SomeInterface extends ExportedInterface {}
```

#### tsconfigPath

• `Optional` **tsconfigPath**: `string`

Path to the tsconfig.json file. If not defined, the default tsconfig.json file will be used.