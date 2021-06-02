export function capitalize(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text[0].toUpperCase() + text.slice(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseKeyValueText(text: string): { key: string, value: any } {
  const index = text.indexOf('=');
  if (index === -1) {
    throw Error('Invalid custom tag');
  }
  const key = text.slice(0, index);
  const valueString = text.slice(index + 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    value = JSON.parse(valueString);
  } catch {
    value = valueString;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { key, value };
}
