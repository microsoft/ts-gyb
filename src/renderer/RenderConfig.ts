export interface RendererConfig {
  globalEntry: string;
  pathMap: Record<string, string>;
  tsCustomTypePrefix: string;
  mergeCustomInterface: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  makeFunctionPublic?: boolean;
  baseIndent: number;
}

export class DefaultSwiftRendererConfig implements RendererConfig {
  'globalEntry' = 'Test';

  'pathMap' = {
    IHtmlApi: 'htmlApi',
    IImageOptionApi: 'imageOptionApi',
  };

  'tsCustomTypePrefix' = 'I';

  'mergeCustomInterface' = true;

  'headerTemplate' = '{';

  'footerTemplate' = '}';

  'makeFunctionPublic' = true;

  'baseIndent' = 2;
}
