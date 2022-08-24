import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { CodeGenerator } from '../generator/CodeGenerator';
import { Configuration, normalizeConfiguration, RenderConfiguration } from '../configuration';

const program = yargs(process.argv.slice(2));

function run(): void {
  /* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
  program
    .scriptName('ts-gyb')
    .command(['gen', '*'], 'generate code from a configuration file', () => {}, generate)
    .command('list-output', 'list all output files', (subprogram) => {
      subprogram
        .option('language', { description: 'language of the output files to list', choices: ['swift', 'kotlin'] })
        .option('expand', { description: 'expand directories' });
    }, listOutput)
    .option('config', {
      describe: 'path to the configuration file',
      type: 'string',
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .demandOption('config')
    .help()
    .parse();
  /* eslint-enable no-empty-function,@typescript-eslint/no-empty-function */
}

function generate(args: { config: string }): void {
  const config = parseConfig(args.config);

  const generator = new CodeGenerator();
  generator.generate(config);
}

function listOutput(args: { config: string; language?: 'swift' | 'kotlin'; expand: boolean }): void {
  const config = parseConfig(args.config);

  let files: string[];
  if (args.language !== undefined) {
    const renderingConfig = config.rendering[args.language];
    if (renderingConfig === undefined) {
      throw new Error(`Language ${args.language} is not defined in the configuration file`);
    }
    files = renderingConfig.renders.map((render) => render.outputPath);
  } else {
    files = Object.values(config.rendering).flatMap((renderingConfig: RenderConfiguration) => renderingConfig.renders.map((render) => render.outputPath));
  }

  files = files.map((file) => path.resolve(file));
  if (args.expand) {
    files = files.map((filePath) => {
      if (!fs.lstatSync(filePath).isDirectory()) {
        return filePath;
      }

      return fs.readdirSync(filePath).map((file) => path.join(filePath, file));
    }).flat();
  }

  files = [...new Set(files)];
  console.log(files.join('\n'));
}

function parseConfig(configPath: string): Configuration {
  const configFile = path.resolve(configPath);
  const projectDirectory = path.dirname(configFile);

  process.chdir(projectDirectory);

  const rawConfig = JSON.parse(fs.readFileSync(configFile).toString()) as Configuration;
  return normalizeConfiguration(rawConfig, projectDirectory);
}

run();
