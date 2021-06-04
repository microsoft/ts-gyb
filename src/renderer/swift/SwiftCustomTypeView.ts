import { CustomType } from '../../types';
import { CustomTypeView } from '../views';
import { SwiftValueTransformer } from './SwiftValueTransformer';

export class SwiftCustomTypeView implements CustomTypeView {
  constructor(
    readonly typeName: string,
    private readonly customType: CustomType,
    private readonly valueTransformer: SwiftValueTransformer
  ) {}

  get members(): { name: string; type: string; last: boolean }[] {
    const members = this.customType.members.filter((member) => member.staticValue === undefined);

    return members.map((member, index) => ({
      name: member.name,
      type: this.valueTransformer.convertValueType(member.type),
      last: index === members.length - 1,
    }));
  }

  get staticMembers(): { name: string; type: string; value: string }[] {
    return this.customType.members
      .filter((member) => member.staticValue !== undefined)
      .map((member) => {
        if (member.staticValue === undefined) {
          throw Error('Value is undefined');
        }

        return {
          name: member.name,
          type: this.valueTransformer.convertValueType(member.type),
          value: this.valueTransformer.convertValue(member.staticValue, member.type),
        };
      });
  }
}
