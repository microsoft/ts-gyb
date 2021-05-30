import ts from 'typescript';

// Defined tags
const SHOULD_EXPORT = 'shouldExport';

export function shouldExportSymbol(symbol: ts.Symbol): boolean {
  const tags = symbol.getJsDocTags();
  return !!tags.find(tag => tag.name === SHOULD_EXPORT && ts.displayPartsToString(tag.text) === 'true');
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
