/* eslint-disable camelcase */

type CodeGen_Int = number & { _intBrand: never };
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
  default = 'default',
  /**
   * Description for enum member a
   */
  a = 'a',
  b = 'b',
}

enum NumEnum {
  default = 0,
  one = 1,
  two = 2,
}

enum DefaultEnum {
  default,
  defaultValueC,
  defaultValueD,
}

/**
 * Example documentation for interface
 * @overrideTypeName OverriddenFullSize
 */
interface FullSize extends BaseSize, CustomSize {
  /**
   * Example documentation for member
   */
  member: NumEnum.one;
  size: number;
  count: CodeGen_Int;
  stringEnum: StringEnum;
  numEnum: NumEnum;
  defEnum: DefaultEnum;
  stringUnion: 'A1' | 'B1';
  numberStringUnion: '11' | '21';
  nullableStringUnion: 'A1' | 'B1' | null;
  numUnion1: 11 | 21;
  foo: { stringField: string } | { numberField: number };
  unionType: string | number | boolean | NumEnum | DefaultEnum | string[] | DictionaryWithAnyKey;
}

interface DictionaryWithAnyKey {
  [key: string]: string;
}


interface ObjectWithDefeaultValue {
  /**
    * @default true
    */
  defaultValue?: boolean;
}

/**
 * Documentation for module
 * @shouldExport true
 * @invokePath htmlApi
 */
export interface IHtmlApi {
  /**
   * This is a documentation
   * Set Mention class names
   * used to map id to class names
   */
  setMentionClassNames({ idToClassNames }: { idToClassNames: { [id: string]: string[] } }): void;
  getHeight(): number;
  getHeightWithBottomAnchor({ sta }: { sta: string[] }): number;
  getHTML({ title }: { title: string }): str;
  requestRenderingResult(): void;
  getSize(): FullSize;
  getAliasSize(): AliasSize;
  getName(): 'A2' | 'B2';
  getAge({ gender }: { gender: 'Male' | 'Female' }): 21 | 22;
  testDictionaryWithAnyKey({ dict }: { dict: DictionaryWithAnyKey }): void;

  testDefaultValue(options: {
    /**
     * @default null
     */
    bool?: boolean;
    bool2?: boolean;
    /**
     * @default true
     */
    bool3: boolean;
    /**
     * @default 1
     */
    num: number;
    /**
     * @default "hello"
     */
    string: string;
  }): ObjectWithDefeaultValue;
}

/**
 * @shouldExport true
 * @invokePath imageOption
 */
export interface IImageOptionApi {
  hideElementWithID({ id }: { id: string }): void;
  restoreElementVisibilityWithID({ id }: { id: string }): void;
  getSourceOfImageWithID({ id }: { id: string }): string | null;
  getImageDataList(): string;
  getContentBoundsOfElementWithID({ id }: { id: string }): string | null;
  getSize(): FullSize;
}
