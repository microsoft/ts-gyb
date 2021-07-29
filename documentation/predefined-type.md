# Predefined Type

To create predefined types, such as mapping `number` in TypeScript to `Int` in Swift, we need to:

1. Create a TypeScript interface or type alias. Example:

    ```ts
    type CodeGen_Int = number;
    ```

2. Specify this custom type in the configuration file. Example:

    ```json
    "parsing": {
      "predefinedTypes": [
        "CodeGen_Int"
      ]
    ```

3. Make sure the mapping is also defined for the  target language renderer. Example:

    ```json
    "rendering": {
      "swift": {
        "typeNameMap": {
          "CodeGen_Int": "Int"
        }
    ```

For full example, please refer to <https://github.com/microsoft/ts-codegen/blob/main/demo/basic/config.json>.
