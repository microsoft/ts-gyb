import { Editor } from "./editor/Editor";
import { onReady } from "./utils/onReady";

onReady(() => {
  const editor = new Editor(document.getElementById("mini-editor") as HTMLDivElement);
  console.log('Editor is ready:', editor);

  // Mount `editor` into global scope
  window.editor = editor;
});
