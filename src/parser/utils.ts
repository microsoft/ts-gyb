import ts from 'typescript';

// Defined tags
const SHOULD_EXPORT = 'shouldExport';
const OVERRIDE_MODULE_NAME = 'overrideModuleName';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseJsDocTags(symbol: ts.Symbol): {
  shouldExport: boolean;
  overrideName: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customTags: Record<string, any>;
} {
  let shouldExport = false;
  let overrideName: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customTags: Record<string, any> = {};

  const tags = symbol.getJsDocTags();
  tags.forEach((tag) => {
    const value = ts.displayPartsToString(tag.text);

    if (tag.name === SHOULD_EXPORT) {
      shouldExport = value === 'true';
      return;
    }

    if (tag.name === OVERRIDE_MODULE_NAME) {
      overrideName = value;
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      customTags[tag.name] = JSON.parse(value);
    } catch {
      customTags[tag.name] = value;
    }
  });

  return { shouldExport, overrideName, customTags };
}

export function isUndefinedOrNull(node: ts.TypeNode): boolean {
  if (ts.isLiteralTypeNode(node)) {
    return node.literal.kind === ts.SyntaxKind.NullKeyword;
  }
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return true;
  }
  return false;
}
