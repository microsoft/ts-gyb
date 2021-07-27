
/**
 * @shouldExport true
 * @invokePath editor
 * @overrideModuleName EditorBridge
 */
export interface IEditor {
  toggleBold(): void;
  toggleItalic(): void;
  toggleUnderline(): void;

  clear(): void;

  insertContent({ content, newLine }: { content: string; newLine?: boolean }): IInsertContentResult;
}

export interface IInsertContentResult {
  html: string;
}