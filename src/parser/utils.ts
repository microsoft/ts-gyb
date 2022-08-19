import ts from 'typescript';

// Defined tags
const SHOULD_EXPORT = 'shouldExport';
const OVERRIDE_MODULE_NAME = 'overrideModuleName';
const OVERRIDE_TYPE_NAME = 'overrideTypeName';

export function parseTypeJSDocTags(symbol: ts.Symbol): {
  shouldExport: boolean;
  overrideName: string | null;
  customTags: Record<string, unknown>;
} {
  let shouldExport = false;
  let overrideName: string | null = null;
  const customTags: Record<string, unknown> = {};

  const tags = symbol.getJsDocTags();
  tags.forEach((tag) => {
    const value = ts.displayPartsToString(tag.text);

    if (tag.name === SHOULD_EXPORT) {
      shouldExport = value === 'true';
      return;
    }

    if (tag.name === OVERRIDE_MODULE_NAME || tag.name === OVERRIDE_TYPE_NAME) {
      overrideName = value;
      return;
    }

    try {
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
