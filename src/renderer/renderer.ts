import fs from 'fs';
import Mustache from 'mustache';

export function renderCode<View>(templatePath: string, view: View): string {
  const template = fs.readFileSync(templatePath).toString();
  return Mustache.render(template, view);
}
