import { Editor } from "./editor/Editor";
import { onReady } from "./utils/onReady";

onReady(() => {
  const editor = new Editor(document.getElementById("mini-editor") as HTMLDivElement);
  console.log('Editor is ready:', editor);
});
