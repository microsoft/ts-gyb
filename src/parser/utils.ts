import ts from 'typescript';

export function extractUnionTypeNode(
  node: ts.Node,
): { typeNode: ts.TypeNode, nullable: boolean } | null {
  if (!ts.isUnionTypeNode(node)) {
    return null;
  }

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
  if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return true;
  }
  return false;
}

