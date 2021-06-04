import { EnumSubType, EnumType } from '../../types';
import { EnumTypeView } from '../views';
import { enumUncapitalize } from './SwiftValueTransformer';

export class SwiftEnumTypeView implements EnumTypeView {
  constructor(private enumType: EnumType) {}

  get typeName(): string {
    return this.enumType.name;
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

  get members(): { key: string; value: string }[] {
    return Object.entries(this.enumType.members).map(([key, value]) => ({
      key: enumUncapitalize(key),
      value: typeof value === 'string' ? `"${value}"` : `${value}`,
    }));
  }
}
