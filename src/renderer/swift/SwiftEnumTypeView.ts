import { EnumSubType, EnumType } from "../../types";
import { EnumTypeView } from '../views';

export class SwiftEnumTypeView implements EnumTypeView {
  constructor(
    readonly typeName: string,
    private enumType: EnumType,
  ) {}

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

  get members(): { key: string, value: string }[] {
    return Object.entries(this.enumType.members).map(([key, value]) => ({ key, value: typeof value === 'string' ? `"${value}"` : `${value}` }));
  }
}
