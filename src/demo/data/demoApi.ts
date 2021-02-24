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
  /**
   * @comment 
   * Set Mention class names
   * used to map id to class names
   */
  setMentionClassNames: (args: { [id: string]: string[] }) => void;
  getHeight: () => number;
  getHeightWithBottomAnchor: (sta: string[]) => number;
  getHTML: (args: { title: string }) => string;
  requestRenderingResult: () => void;
  getSize: () => FullSize;
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
