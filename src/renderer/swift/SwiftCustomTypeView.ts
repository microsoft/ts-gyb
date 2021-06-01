import { CustomType } from '../../types';
import { CustomTypeView } from '../views';
import { convertValueType } from './value-transformers';

export class SwiftCustomTypeView implements CustomTypeView {
  constructor(readonly typeName: string, private customType: CustomType) {}

  get members(): { name: string; type: string; last: boolean }[] {
    return this.customType.members.map((member, index) => ({
      name: member.name,
      type: convertValueType(member.type),
      last: index === this.customType.members.length - 1,
    }));
  }
}
