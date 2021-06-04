import { CustomType } from '../../types';
import { CustomTypeView } from '../views';
import { SwiftValueTransformer } from './SwiftValueTransformer';

export class SwiftCustomTypeView implements CustomTypeView {
  constructor(readonly typeName: string, private readonly customType: CustomType, private readonly valueTransformer: SwiftValueTransformer) {}

  get members(): { name: string; type: string; last: boolean }[] {
    return this.customType.members.map((member, index) => ({
      name: member.name,
      type: this.valueTransformer.convertValueType(member.type),
      last: index === this.customType.members.length - 1,
    }));
  }
}
