[@olm/ts-codegen](../README.md) / [Exports](../modules.md) / ParseConfiguration

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

### source

• **source**: `Record`<`string`, `string`[]\>

Scoped source file paths. The key is the scope name and the value is an array of the source file paths.
If it is a relative path, it will be resolved based on the configuration file path.

For example, `{ "api": ["src/api/IEditor.ts", "src/api/ILogger.ts"] }`
