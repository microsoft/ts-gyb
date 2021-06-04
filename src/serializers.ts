import chalk from 'chalk';
import { NamedType } from './generator/named-types';
import {
  Field,
  isArraryType,
  isBasicType,
  isCustomType,
  isDictionaryType,
  isEnumType,
  isOptionalType,
  isPredefinedType,
  Method,
  Module,
  ValueType,
  Value,
} from './types';

const keywordColor = chalk.green;
const identifierColor = chalk.blue;
const typeColor = chalk.yellow;
const valueColor = chalk.cyan;
const documentationColor = chalk.gray;

export function serializeModule(module: Module, associatedTypes: NamedType[]): string {
  const serializedAssociatedTypes = associatedTypes.map((associatedType) => serializeNamedType(associatedType));
  const customTags =
    Object.keys(module.customTags).length > 0 ? `Custom tags: ${JSON.stringify(module.customTags)}\n` : '';

  return `${serializeDocumentation(module.documentation)}${documentationColor(customTags)}${keywordColor('Module')} ${
    module.name
  } {
${module.methods
  .map((method) =>
    serializeMethod(method)
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n')
  )
  .join('\n')}${
    serializedAssociatedTypes.length > 0
      ? `\n\n${serializedAssociatedTypes
          .join('\n')
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n')}`
      : ''
  }
}`;
}

export function serializeNamedType(namedType: NamedType): string {
  if (isCustomType(namedType)) {
    return `${keywordColor('Type')} ${namedType.name} {
${namedType.members
  .map(
    (member) =>
      `  ${keywordColor('var')} ${serializeField(member)}`
  )
  .join('\n')}
}`;
  }

  return `${keywordColor('Enum')} ${namedType.name} {
${Object.entries(namedType.members)
  .map(([key, value]) => `  ${identifierColor(key)} = ${valueColor(value)}`)
  .join('\n')}
}`;
}

function serializeMethod(method: Method): string {
  const serializedReturnType =
    method.returnType !== null ? `: ${typeColor(serializeValueType(method.returnType))}` : '';
  return `${serializeDocumentation(method.documentation)}${keywordColor('func')} ${identifierColor(
    method.name
  )}(${method.parameters
    .map((parameter) => `${parameter.name}: ${typeColor(serializeValueType(parameter.type))}`)
    .join(', ')})${serializedReturnType}`;
}

function serializeField(field: Field): string {
  const staticValue = field.staticValue !== undefined ? ` = ${serializeStaticValue(field.staticValue, field.type)}` : '';
  return `${identifierColor(field.name)}: ${typeColor(serializeValueType(field.type))}${staticValue}`;
}

function serializeValueType(valueType: ValueType): string {
  if (isBasicType(valueType)) {
    return valueType.value;
  }
  if (isCustomType(valueType)) {
    if (valueType.name === undefined) {
      throw Error('Unable to serialize unnamed custom type');
    }
    return valueType.name;
  }
  if (isEnumType(valueType)) {
    return valueType.name;
  }
  if (isArraryType(valueType)) {
    return `[${serializeValueType(valueType.elementType)}]`;
  }
  if (isDictionaryType(valueType)) {
    return `[${valueType.keyType}: ${serializeValueType(valueType.valueType)}]`;
  }
  if (isOptionalType(valueType)) {
    return `${serializeValueType(valueType.wrappedType)}?`;
  }
  if (isPredefinedType(valueType)) {
    return valueType.name;
  }

  throw Error('Unhandled value type');
}

function serializeStaticValue(value: Value, type: ValueType): string {
  if (isEnumType(type)) {
    return `${type.name}.${value as string}`;
  }

  return JSON.stringify(value);
}

function serializeDocumentation(documentation: string): string {
  if (documentation.length === 0) {
    return '';
  }

  return documentationColor(`/**
${documentation
  .split('\n')
  .map((line) => ` * ${line}`)
  .join('\n')}
 */
`);
}
