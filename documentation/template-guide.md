# Template Guide

ts-codegen uses [mustache](http://mustache.github.io) template to generate code. Refer to [mustache Manul](http://mustache.github.io/mustache.5.html) for supported syntax.

## Required templates

ts-codegen needs two templates: module template and named type template.

### Module template

ts-codegen uses this template to generate a file for every module. Typically, generated file includes a module class and all types used in the method parameters and return values of the module.

### Named type template

When a TypeScript `interface` or an `enum` is used by more than one module, it is not suitable to place the generated type in any module file. ts-codegen uses this template to generate a single file that hosts all shared TypeScript types found in method parameters and return types.

## Variables

ts-codegen defines some variables that can be directly used in templates.

### Variables in templates

- **Module template**: this template has access to all properties of [`Module`](#module). For example, you can use `{{moduleName}}` to render the name of the module.
- **Named type template**: this template has only one array variable of type [`NamedType`](#namedtype) which includes all named types. For example, use `{{#.}}{{typeName}}{{/.}}` to enumerate the array and get all type names.

Both `associatedTypes` in Module template and the variable of Named type template is an array of [`NamedType`](#namedtype). It is recommended to create a template to render a single `NamedType`, then import the template in other templates.

### Data structure

#### `Module`

- `moduleName`: the name of the module.
- `methods`: an array of [`Method`](#method).
- `associatedTypes`: an array of [`NamedType`](#namedtype). This includes all types used only in this module.
- `customTags`: an object of all custom defined values in module interface. Refer to [Custom tags](interface-guide.md#custom-tags) for how to define these tags. For example, you can access `@foobar { "key": "value" }` via `{{customTags.foobar.key}}`.
- `documentationLines`: an array of documentation text divided to string lines. It is divided for easier use with mustache.

#### `Method`

- `methodName`: the name of the method.
- `parameters`: an array of [`Parameter`](#parameter) to include all parameters of the method.
- `parametersDeclaration`: a single line parameters declaration. It can be directly used inside `()` to declare all parameters of this method.
- `returnType`: a string to represent the return type of the method.
- `nonOptionalReturnType`: a string to represent the return type but stripped optional syntax. For non optional types, this would be the same as `returnType`.
- `documentationLines`: an array of documentation text divided to string lines. It is divided for easier use with mustache.

#### `Parameter`

- `name`: the name of the parameter.
- `type`: a string to represent the type of the parameter.
- `last`: a boolean to indicate whether this is the last parameter. It is for convenience of writing mustache templates.

#### `NamedType`

- `custom`: a boolean to indicate whether this is an interface type.
- `enum`: a boolean to indicate whether this is an enum type.

For interface type:

- `typeName`: the name of the type.
- `members`: an array of [`InterfaceMember`](#interfacemember). It includes all members of the interface type.
- `documentationLines`: an array of documentation text divided to string lines. It is divided for easier use with mustache.

For enum type:

- `typeName`: the name of the type.
- `valueType`: a string to represent the type of the raw value of the enum.
- `isNumberType`: a boolean to indicate whether this is a numeric enum.
- `isStringType`: a boolean to indicate whether this is a string enum.
- `members`: an array of [`EnumMember`](#interfacemember). It includes all members of the enum type.
- `documentationLines`: an array of documentation text divided to string lines. It is divided for easier use with mustache.

#### `InterfaceMember`

- `name`: the name of the interface member.
- `type`: a string to represent the type of the member.
- `documentationLines`: an array of documentation text divided to string lines. It is divided for easier use with mustache.
- `last`: a boolean to indicate whether this is the last member. It is for convenience of writing mustache templates.

#### `EnumMember`

- `key`: the key of the enum member
- `value`: a string to represent the value of the enum member
- `documentationLines`: an array of documentation text divided to string lines. It is divided for easier use with mustache.
- `last`: a boolean to indicate whether this is the last member. It is for convenience of writing mustache templates.
