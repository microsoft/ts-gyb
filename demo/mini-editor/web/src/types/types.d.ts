import { IEditor } from '../editor/IEditor';

declare global {
  interface Window {
    editor: IEditor;
  }
}