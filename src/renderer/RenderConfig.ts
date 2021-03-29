export interface ModuleMeta {
  pathMap: string;
  fileName: string;
  definedValues?: { [k: string]: string };
}

export type ModulesMeta = Record<string, ModuleMeta>;

export interface RendererConfig {
  globalEntry: string;
  modules: ModulesMeta;
  tsCustomTypePrefix: string;
  customInterfaceFileName?: string;
  customInterfacePrefixToBeAdded?: string;
  tsCustomTypePrefixToBeRemoved?: string;
  customInterfaceFileHeaderTemplate?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  makeFunctionPublic?: boolean;
  baseIndent: number;
}

export const DefaultRendererModules: ModulesMeta = {
  IHtmlApi: { pathMap: 'htmlApi', definedValues: { name: 'htmlApi' }, fileName: 'htmlApi' },
  IImageOptionApi: {
    pathMap: 'imageOptionApi',
    definedValues: { name: 'imageOptionApi' },
    fileName: 'imageOptionApi',
  },
};

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
