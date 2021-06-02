import fs from 'fs';
import path from 'path';
import Mustache from 'mustache';

export function renderCode<View>(templatePath: string, view: View): string {
  const template = fs.readFileSync(templatePath).toString();
  const directory = path.dirname(templatePath);
  return Mustache.render(template, view, (partialName) => {
    const partialPath = path.join(directory, `${partialName}.mustache`);
    return fs.readFileSync(partialPath).toString();
  });
}
