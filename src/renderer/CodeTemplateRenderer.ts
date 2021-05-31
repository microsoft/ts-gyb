import fs from 'fs';
import path from 'path';
import Mustache from 'mustache';
import { ModuleView } from './ModuleView';

export class CodeTemplateRenderer {
  constructor(
    private templatePath: string,
    private targetDirectory: string,
  ) {}

  renderModules(moduleViews: ModuleView[]): void {
    moduleViews.forEach(moduleView => {
      this.renderModuleView(moduleView);
    });
  }

  private renderModuleView(moduleView: ModuleView): void {
    const template = fs.readFileSync(this.templatePath).toString();
    const renderedCode = Mustache.render(template, moduleView);

    const filePath = path.join(this.targetDirectory, moduleView.fileName);
    fs.writeFileSync(filePath, renderedCode);
  }
}
