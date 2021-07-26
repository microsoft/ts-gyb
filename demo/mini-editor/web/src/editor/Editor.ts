import { IEditor } from "./IEditor";

export class Editor implements IEditor {
  constructor(private contentEditableDiv: HTMLDivElement) {}

  toggleBold(): void {
    document.execCommand('bold');
  }

  toggleItalic(): void {
    document.execCommand('italic');
  }

  toggleUnderline(): void {
    document.execCommand('underline');
  }

  clear(): void {
    this.contentEditableDiv.innerHTML = '';
    this.contentEditableDiv.focus();
  }

  insertContent({ content, newLine }: { content: string; newLine?: boolean | undefined; }): void {
    const contentBeingInserted = newLine ? `${content}\n` : content;
    document.execCommand('insertHTML', false, contentBeingInserted);
  }
}