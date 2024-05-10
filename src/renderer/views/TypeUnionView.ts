import { uncapitalize } from "../../utils";
import { TypeUnion, isBasicType } from '../../types';
import { ValueTransformer } from '../value-transformer';

export class TypeUnionView {
  constructor(
    private readonly value: TypeUnion,
    private readonly valueTransformer: ValueTransformer
  ) { }

  get typeName(): string {
    return this.valueTransformer.convertTypeNameFromCustomMap(this.value.name);
  }

  get hasBasicType(): boolean {
    const { members } = this.value;

    return members.filter(isBasicType).length > 0;
  }

  get hasTupleType(): boolean {
    const { members } = this.value;

    return members.filter(isBasicType).length !== members.length;
  }

  get members(): {
    name: string,
    type: string;
    first: boolean;
    last: boolean;
    isTuple: boolean;
    isNumber: boolean;
    isBoolean: boolean;
    isString: boolean;
  }[] {
    const { members } = this.value;

    return members.map((member, index) => {
      const typeName = this.valueTransformer.convertValueType(member);
      return {
        name: uncapitalize(typeName),
        type: typeName,
        first: index === 0,
        last: index === members.length - 1,
        isTuple: !isBasicType(member),
        isNumber: isBasicType(member) && member.value === 'number',
        isBoolean: isBasicType(member) && member.value === 'boolean',
        isString: isBasicType(member) && member.value === 'string',
      };
    });
  }
}
