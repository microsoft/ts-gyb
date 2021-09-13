[ts-gyb](../README.md) / [Exports](../modules.md) / RenderConfiguration

# Interface: RenderConfiguration

Renderer configuration

## Table of contents

### Properties

- [namedTypesOutputPath](RenderConfiguration.md#namedtypesoutputpath)
- [namedTypesTemplatePath](RenderConfiguration.md#namedtypestemplatepath)
- [outputPath](RenderConfiguration.md#outputpath)
- [templates](RenderConfiguration.md#templates)
- [typeNameMap](RenderConfiguration.md#typenamemap)

## Properties

### namedTypesOutputPath

• **namedTypesOutputPath**: `string`

Output path for named types.
If it is a relative path, it will be resolved based on the configuration file path.

___

### namedTypesTemplatePath

• **namedTypesTemplatePath**: `string`

Template path for named types. Must be a mustache template.
If it is a relative path, it will be resolved based on the configuration file path.

For example, `code-templates/named-types.mustache`.

___

### outputPath

• **outputPath**: `Record`<`string`, `string`\>

Scoped output directories or paths. The key is the scope name and the value is the output directory or file path.

If it is a relative path, it will be resolved based on the configuration file path.

For example, `{ "api": "../ios/AppTarget/Generated" }`

___

### templates

• **templates**: `Record`<`string`, `string`\>

Scoped template file paths. The key is the scope name and the value is the template file path.
If it is a relative path, it will be resolved based on the configuration file path.

___

### typeNameMap

• `Optional` **typeNameMap**: `Record`<`string`, `string`\>

The mapping from `predefinedTypes` to the existing types in the target language (Kotlin/Swift).

For example, `{ "CodeGen_Int": "Int" }`.
