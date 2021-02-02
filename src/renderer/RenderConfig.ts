export interface ModuleMeta {
  pathMap: string;
  fileName: string;
  definedValues?: { [k: string]: string };
}

export interface RendererConfig {
  globalEntry: string;
  modules: Record<string, ModuleMeta>;
  tsCustomTypePrefix: string;
  customInterfaceFileName?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  makeFunctionPublic?: boolean;
  baseIndent: number;
}

export class DefaultSwiftRendererConfig implements RendererConfig {
  'globalEntry' = 'Test';

  'modules' = {
    IHtmlApi: { pathMap: 'htmlApi', definedValues: { name: 'htmlApi' }, fileName: 'htmlApi' },
    IImageOptionApi: {
      pathMap: 'imageOptionApi',
      definedValues: { name: 'imageOptionApi' },
      fileName: 'imageOptionApi',
    },
  };

  'tsCustomTypePrefix' = 'I';

  'headerTemplate' = '{ // %%name%%';

  'footerTemplate' = '}';

  'makeFunctionPublic' = true;

  'baseIndent' = 2;
}
