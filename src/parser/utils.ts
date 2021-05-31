import ts from 'typescript';

// Defined tags
const SHOULD_EXPORT = 'shouldExport';
const OVERRIDE_MODULE_NAME = 'overrideModuleName';

export function parseJsDocTags(symbol: ts.Symbol): { shouldExport: boolean, overrideName: string | null, customTags: Record<string, string> } {
  let shouldExport = false;
  let overrideName: string | null = null;
  const customTags: Record<string, string> = {};

  const tags = symbol.getJsDocTags();
  tags.forEach(tag => {
    const value = ts.displayPartsToString(tag.text);

    if (tag.name === SHOULD_EXPORT) {
      shouldExport = value === 'true';
      return;
    }

    if (tag.name === OVERRIDE_MODULE_NAME) {
      overrideName = value;
      return;
    }

    customTags[tag.name] = value;
  });

  return { shouldExport, overrideName, customTags };
}

export function extractUnionTypeNode(
  node: ts.UnionTypeNode,
): { typeNode: ts.TypeNode, nullable: boolean } {
  let nullable = false;
  let wrappedTypeNode: ts.TypeNode | undefined;

  node.types.forEach(typeNode => {
    if (isUndefinedOrNull(typeNode)) {
      nullable = true;
      return;
    }

    if (wrappedTypeNode) {
      throw Error('Do not support multiple union types');
    }
    wrappedTypeNode = typeNode;
  });

  if (!wrappedTypeNode) {
    throw Error('Invald union type');
  }

  return {
    typeNode: wrappedTypeNode,
    nullable,
  };
}

function isUndefinedOrNull(node: ts.TypeNode): boolean {
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
