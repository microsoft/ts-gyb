import { uncapitalize } from "../../utils";
import { UnionType, isBasicType } from '../../types';
import { ValueTransformer } from '../value-transformer';

export class UnionTypeView {
  constructor(
    private readonly value: UnionType,
    private readonly valueTransformer: ValueTransformer
  ) { }

  get typeName(): string {
    return this.valueTransformer.convertTypeNameFromCustomMap(this.value.name);
  }

  get members(): {
    name: string,
    type: string;
    first: boolean;
    last: boolean;
  }[] {
    const { members } = this.value;

    return members
      // put basic types to last
      .sort((a, b) => {
        if (isBasicType(a) && isBasicType(b)) {
          // put string to last
          if (a.value === 'string' && b.value === 'string') {
            return 0;
          }

          if (a.value === 'string') {
            return 1;
          }

          return -1;
        }

        if (isBasicType(a) && !isBasicType(b)) {
          return 1;
        }

        if (!isBasicType(a) && isBasicType(b)) {
          return -1;
        }

        return 0;
      })
      .map((member, index) => {
      const typeName = this.valueTransformer.convertValueType(member);
      return {
        name: uncapitalize(typeName),
        type: typeName,
        first: index === 0,
        last: index === members.length - 1,
      };
    });
  }
}
