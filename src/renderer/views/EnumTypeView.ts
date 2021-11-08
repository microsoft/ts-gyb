import { ValueTypeSource } from '../../generator/named-types';
import { EnumSubType, EnumType } from '../../types';
import { getDocumentationLines } from '../utils';
import { ValueTransformer } from '../value-transformer';

export class EnumTypeView {
  constructor(
    private readonly enumType: EnumType,
    private readonly source: ValueTypeSource,
    private readonly valueTransformer: ValueTransformer
  ) {}

  get typeName(): string {
    return this.valueTransformer.convertTypeNameFromCustomMap(this.enumType.name);
  }

  get valueType(): string {
    switch (this.enumType.subType) {
      case EnumSubType.string:
        return 'String';
      case EnumSubType.number:
        return 'Int';
      default:
        throw Error('Unhandled enum subtype');
    }
  }

  get isNumberType(): boolean {
    return this.enumType.subType === EnumSubType.number;
  }

  get isStringType(): boolean {
    return this.enumType.subType === EnumSubType.string;
  }

  get members(): { key: string; value: string; documentationLines: string[]; last: boolean }[] {
    const { members } = this.enumType;

    return members.map((member, index) => ({
      key: this.valueTransformer.convertEnumKey(member.key),
      value: typeof member.value === 'string' ? `"${member.value}"` : `${member.value}`,
      documentationLines: getDocumentationLines(member.documentation),
      last: index === members.length - 1,
    }));
  }

  get documentationLines(): string[] {
    return getDocumentationLines(this.enumType.documentation);
  }

  get customTags(): Record<string, unknown> {
    return this.enumType.customTags;
  }

  get isFromParameter(): boolean {
    return (this.source & ValueTypeSource.Parameter) === ValueTypeSource.Parameter;
  }

  get isFromReturn(): boolean {
    return (this.source & ValueTypeSource.Return) === ValueTypeSource.Return;
  }
}
