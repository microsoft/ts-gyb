import ts from 'typescript';

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

    if (isBrandLiteralTypeNode(typeNode)) {
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

function isBrandLiteralTypeNode(node: ts.TypeNode): boolean {
  if (!ts.isTypeLiteralNode(node)) {
    return false;
  }
  if (node.members.length !== 1) {
    return false;
  }

  const brandName = node.members[0].name?.getText();
  if (!brandName) {
    return false;
  }

  return brandName === '_brand' || brandName.startsWith('_') && brandName.endsWith('Brand');
}
