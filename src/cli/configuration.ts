/**
 * Parser configuration
 */
export interface ParseConfiguration {
  /**
   * Scoped source file paths. The key is the scope name and the value is an array of the source file paths.
   * If it is a relative path, it will be resolved based on the configuration file path.
   * 
   * For example, `{ "api": ["src/api/IEditor.ts", "src/api/ILogger.ts"] }`
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
   */
  dropInterfaceIPrefix?: boolean;
  /**
   * Skip the code generation for invalid methods. If `false`, the code generation will fail.
   */
  skipInvalidMethods?: boolean;
}

/**
 * Renderer configuration
 */
export interface RenderConfiguration {
  /**
   * Scoped templated file paths. The key is the scope name and the value is the templated file path.
   * If it is a relative path, it will be resolved based on the configuration file path.
   */
  templates: Record<string, string>;
  /**
   * Scoped output file paths. The key is the scope name and the value is the output file path.
   * If it is a relative path, it will be resolved based on the configuration file path.
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
  rendering: { swift?: RenderConfiguration; kotlin?: RenderConfiguration };
}
