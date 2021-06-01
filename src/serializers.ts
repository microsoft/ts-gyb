import chalk from 'chalk';
import { NamedType } from './parser/named-types';
import {
  isArraryType,
  isBasicType,
  isCustomType,
  isDictionaryType,
  isEnumType,
  isOptionalType,
  Method,
  Module,
  ValueType,
} from './types';

const keywordColor = chalk.green;
const identifierColor = chalk.blue;
const typeColor = chalk.yellow;
const valueColor = chalk.cyan;
const documentationColor = chalk.gray;

export function serializeModule(module: Module): string {
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
  .join('\n')}
}`;
}

export function serializeNamedType(typeName: string, namedType: NamedType): string {
  if (isCustomType(namedType)) {
    return `${keywordColor('Type')} ${typeName} {
${namedType.members
  .map(
    (member) =>
      `  ${keywordColor('var')} ${identifierColor(member.name)}: ${typeColor(serializeValueType(member.type))}`
  )
  .join('\n')}
}`;
  }

  return `${keywordColor('Enum')} ${typeName} {
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

  throw Error('Unhandled value type');
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
