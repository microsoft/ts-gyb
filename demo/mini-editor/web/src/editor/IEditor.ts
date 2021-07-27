
/**
 * @shouldExport true
 * @invokePath editor
 */
export interface IEditor {
  toggleBold(): void;
  toggleItalic(): void;
  toggleUnderline(): void;

  clear(): void;

  insertContent({ content, newLine }: { content: string; newLine?: boolean }): void;
}