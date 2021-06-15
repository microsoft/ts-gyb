import { InterfaceType } from '../../types';
import { InterfaceTypeView } from '../views';

export class KotlinInterfaceTypeView implements InterfaceTypeView {
  constructor(
    readonly typeName: string,
    private readonly interfaceType: InterfaceType,
  ) {}

  get members(): { name: string; type: string; last: boolean }[] {
    const members = this.interfaceType.members.filter((member) => member.staticValue === undefined);

    return [];
    // return members.map((member, index) => ({
    //   name: member.name,
    //   type: this.valueTransformer.convertValueType(member.type),
    //   last: index === members.length - 1,
    // }));
  }

  get staticMembers(): { name: string; type: string; value: string }[] {
    return this.interfaceType.members
      .filter((member) => member.staticValue !== undefined)
      .map((member) => {
        if (member.staticValue === undefined) {
          throw Error('Value is undefined');
        }

        return {
          name: member.name,
          type: '',
          value: '',
        };
      });
  }
}
