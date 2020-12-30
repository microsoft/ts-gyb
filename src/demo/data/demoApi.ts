import { IExportedApi } from '../../index';

export interface IHtmlApi extends IExportedApi {
  getHeight: () => number;
  getHeightWithBottomAnchor: (sta: string[]) => number;
  getHTML: (args: {title: string}) => string;
  requestRenderingResult: () => void;
}

export interface IImageOptionApi extends IExportedApi {
  hideElementWithID: (ID: string) => void;
  restoreElementVisibilityWithID: (ID: string) => void;
  getSourceOfImageWithID: (ID: string) => string | null;
  getImageDataList: () => string;
  getContentBoundsOfElementWithID: (ID: string) => string | null;
}
