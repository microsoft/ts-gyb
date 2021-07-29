import { normalizePath } from '../utils';

/**
 * Parser configuration
 */
export interface ParseConfiguration {
  /**
   * Scoped source file paths. The key is the scope name and the value is an array of the source file paths. [Glob patterns](https://en.wikipedia.org/wiki/Glob_(programming)) are allowed.
   * If it is a relative path, it will be resolved based on the configuration file path.
   * 
   * For example, `{ "api": ["src/api/IEditor.ts", "src/bridge/*.ts"] }`
   */
  source: Record<string, string[]>;
  /**
   * Names for pre-defined types.
   * For example, `CodeGen_Int` for mapping for `number` to integers.
   */
  predefinedTypes?: string[];
  /**
   * Custom tags for code generation in mustache and its default value. 
   */
  defaultCustomTags?: Record<string, unknown>;
  /**
   * Drop the `I` prefix for TypeScript interfaces.
   * This only works for types used as method parameters or return value.
   */
  dropInterfaceIPrefix?: boolean;
  /**
   * Skip the code generation for invalid methods. If `false`, the code generation will fail when encounter an unsupported type.
   */
  skipInvalidMethods?: boolean;
}

/**
 * Renderer configuration
 */
export interface RenderConfiguration {
  /**
   * Scoped template file paths. The key is the scope name and the value is the templated file path.
   * If it is a relative path, it will be resolved based on the configuration file path.
   */
  templates: Record<string, string>;
  /**
   * Scoped output directories. The key is the scope name and the value is the output file path.
   * If it is a relative path, it will be resolved based on the configuration file path.
   * 
   * For example, `{ "api": "../ios/AppTarget/Generated" }`
   */
  outputDirectory: Record<string, string>;
  /**
   * Template path for named types. Must be a mustache template.
   * If it is a relative path, it will be resolved based on the configuration file path.
   * 
   * For example, `code-templates/named-types.mustache`.
   */
  namedTypesTemplatePath: string;
  /**
   * Output path for named types.
   * If it is a relative path, it will be resolved based on the configuration file path.
   */
  namedTypesOutputPath: string;
  /**
   * The mapping from `predefinedTypes` to the existing types in the target language (Kotlin/Swift).
   * 
   * For example, `{ "CodeGen_Int": "Int" }`.
   */
  typeNameMap?: Record<string, string>;
}

/**
 * Language rendering configuration
 */
interface LanguageRenderingConfiguration {
  swift?: RenderConfiguration;
  kotlin?: RenderConfiguration;
}

/**
 * Root configuration
 */
export interface Configuration {
  /**
   * Parser configuration
   */
  parsing: ParseConfiguration;
  /**
   * Code generation configuration for different languages
   */
  rendering: LanguageRenderingConfiguration;
}

function normalizeRenderConfiguration(basePath: string, config?: RenderConfiguration): RenderConfiguration | undefined {
  if (!config) {
    return config;
  }
  let { namedTypesTemplatePath, namedTypesOutputPath } = config;
  const { templates, outputDirectory, typeNameMap } = config;

  namedTypesOutputPath = normalizePath(namedTypesOutputPath, basePath);
  namedTypesTemplatePath = normalizePath(namedTypesTemplatePath, basePath);

  Object.keys(templates).forEach(key => {
    templates[key] = normalizePath(templates[key], basePath);
  });

  Object.keys(outputDirectory).forEach(key => {
    outputDirectory[key] = normalizePath(outputDirectory[key], basePath);
  });

  return {
    templates,
    outputDirectory,
    namedTypesTemplatePath,
    namedTypesOutputPath,
    typeNameMap,
  };
}

export function normalizeConfiguration(config: Configuration, basePath: string): Configuration {
  const { parsing, rendering } = config;
  const { source, predefinedTypes, defaultCustomTags, dropInterfaceIPrefix, skipInvalidMethods } = parsing;
  let { swift: swiftConfig, kotlin: kotlinConfig } = rendering;

  swiftConfig = normalizeRenderConfiguration(basePath, swiftConfig);
  kotlinConfig = normalizeRenderConfiguration(basePath, kotlinConfig);

  return {
    parsing: {
      source,
      predefinedTypes,
      defaultCustomTags,
      dropInterfaceIPrefix,
      skipInvalidMethods,
    },
    rendering: {
      swift: swiftConfig,
      kotlin: kotlinConfig,
    },
  };
}
