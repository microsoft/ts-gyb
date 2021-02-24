interface BaseSize {
  width: number;
  height: number;
}

interface CustomSize {
  scale: number;
}

interface FullSize extends BaseSize, CustomSize {
  size: number;
}

interface DictionaryWithAnyKey {
  [key: string]: string;
}

/**
 * @shouldExport true
 */
export interface IHtmlApi {
  getHeight: () => number;
  getHeightWithBottomAnchor: (sta: string[]) => number;
  getHTML: (args: { title: string }) => string;
  requestRenderingResult: () => void;
  getSize: () => FullSize;
  setMentionClassNames: (args: { [id: string]: string[] }) => void;
  testDictionaryWithAnyKey: (args: DictionaryWithAnyKey) => void;
}

/**
 * @shouldExport true
 */
export interface IImageOptionApi {
  hideElementWithID: (ID: string) => void;
  restoreElementVisibilityWithID: (ID: string) => void;
  getSourceOfImageWithID: (ID: string) => string | null;
  getImageDataList: () => string;
  getContentBoundsOfElementWithID: (ID: string) => string | null;
}
