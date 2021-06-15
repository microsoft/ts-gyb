export function getDocumentationLines(documentation: string): string[] {
  if (documentation.length === 0) {
    return [];
  }

  return documentation.split('\n').map((line) => (line.length !== 0 ? ` ${line.trimEnd()}` : ''));
}
