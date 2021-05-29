/* eslint-disable camelcase */
// eslint-disable-next-line import/no-unresolved
import { CodeGen_Int } from '@olm/ts-codegen-basic-type';

type str = string;
type AliasSize = BaseSize;
interface BaseSize {
  width: number;
  height: number;
}

interface CustomSize {
  scale: number;
}

enum StringEnum {
  a = 'a',
  b = 'b',
}

enum NumEnum {
  one = 1,
  two = 2,
}

enum DefaultEnum {
  c,
  d,
}

interface FullSize extends BaseSize, CustomSize {
  size: number;
  count: CodeGen_Int;
  stringEnum: StringEnum;
  numEnum: NumEnum;
  defEnum: DefaultEnum;
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
  setMentionClassNames({ idToClassNames }: {idToClassNames: { [id: string]: string[] }}): void;
  getHeight(): number;
  getHeightWithBottomAnchor({ sta }: { sta: string[] }): number;
  getHTML({ title }: { title: string }): str;
  requestRenderingResult(): void;
  getSize(): FullSize;
  getAliasSize(): AliasSize;
  testDictionaryWithAnyKey({ dict }: { dict: DictionaryWithAnyKey }): void;
}

/**
 * @shouldExport true
 */
export interface IImageOptionApi {
  hideElementWithID({ id }: { id: string }): void;
  restoreElementVisibilityWithID({ id }: { id: string }): void;
  getSourceOfImageWithID({ id }: { id: string }): string | null;
  getImageDataList(): string;
  getContentBoundsOfElementWithID({ id }: { id: string }): string | null;
}
