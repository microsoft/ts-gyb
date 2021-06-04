export function capitalize(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text[0].toUpperCase() + text.slice(1);
}

export function uncapitalize(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text[0].toLowerCase() + text.slice(1);
}
