# ts-codegen

ts-codegen is a multi-purpose code generation tool based on TypeScript interfaces. It was initially designed for generating boilerplate interfacing code between web and mobile platforms in hybrid apps. With custom templates, it can generate code for any use from TypeScript.

## Features

## Installation

To use ts-codegen with an existing project managed by npm, it is recommended to install ts-codegen as a dev dependency:

```shell
npm install --save-dev @microsoft/ts-codegen
```

You can also install ts-codegen globally:

```shell
npm install --global @microsoft/ts-codegen
```

## Get Started

### 1. Define TypeScript interfaces

To generate code for a TypeScript interface, add the JSDoc tag `@shouldExport true` to documentation of the interface.

```typescript
/**
 * @shouldExport true
 */
interface EditorSelection {
  getSelectionPath(): SelectionPath | null;

  // Function can have only one argument and it must be an object
  setSelection(args: { selectionPath: SelectionPath }): void;

  // Destructuring assignment is allowed
  setSelectionAtElement({ id, removeElement }: { id: string, removeElement?: boolean }): void;
}
```

ts-codegen only handles method members like `methodName(): ReturnType;`. If a method needs to take in parameters, it must define one object argument. The type of the object can either be an interface or an object literal. For more information on how to write interfaces for ts-codegen, please refer to [TypeScript Interface Guide](documentation/interface-guide.md).

### 2. Provide templates

ts-codegen generates code from [mustache](http://mustache.github.io) templates. At least two templates are needed:

- **Module template**: used to generate a file for every TypeScript interface
- **Custom types template**: used to generate the file that hosts all TypeScript types found in method parameters or return types

For generating boilerplate interfacing code between web and mobile platforms, a good starting point is the [example templates](example-templates). You can copy the templates to your project and modify them according to your project's needs.

Please refer to [Template Guide](documentation/template-guide.md) for all available variables, and [mustache Manual](http://mustache.github.io/mustache.5.html) for mustache template syntax.

### 3. Create a configuration file

Create a json configuration file in your project:

```json
{
  "parsing": {
    "source": {
      "default": ["path/to/interfaces.ts"]
    }
  },
  "rendering": {
    "swift": {
      "templates": {
        "default": "path/to/module-interface.mustache"
      },
      "outputDirectory": {
        "default": "path/to/output/directory"
      },
      "namedTypesTemplatePath": "path/to/named-types.mustache",
      "namedTypesOutputPath": "path/to/output/directory/SharedTypes.swift"
    }
  }
}
```

All paths are relative to the configuration file. For all supported options in the configuration file, please refere to [Configuration Reference](documentation/configuration-reference.md).

### 4. Run ts-codegen

```shell
npx ts-codegen --config path/to/config.json
```

Or if ts-codegen is installed globally:

```shell
ts-codegen --config path/to/config.json
```

Generated code can be found at the output directory specified in the configuration file.

## Demos

[mini-editor](demo/mini-editor) contains an iOS and an Android rich text editing app. Their editors are powered by the same TypeScript web project.

The web part provides some rich text formatting operations that can be invoked from iOS native. The operations are defined in [IEditor.ts](demo/mini-editor/web/src/editor/IEditor.ts). ts-codegen generates [EditorBridge.swift](demo/mini-editor/apple/MiniEditor/Generated/EditorBridge.swift) from that TypeScript interface.

## Documentation

- [TypeScript Interface Guide](documentation/interface-guide.md)
- [Template Guide](documentation/template-guide.md)
- [Configuration Reference](documentation/configuration-reference.md)

## Contributing

This project welcomes contributions and suggestions. Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft 
trademarks or logos is subject to and must follow 
[Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
