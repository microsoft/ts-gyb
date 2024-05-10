import { capitalize, uncapitalize } from "../../utils";
import { DictionaryKeyType, UnionType, ValueType, isArraryType, isBasicType, isDictionaryType } from '../../types';
import { ValueTransformer } from '../value-transformer';

export class UnionTypeView {
  constructor(
    private readonly value: UnionType,
    private readonly valueTransformer: ValueTransformer
  ) { }

  get unionTypeName(): string {
    return this.valueTransformer.convertTypeNameFromCustomMap(this.value.name);
  }

  convertValueTypeToUnionMemberName(valueType: ValueType): string {
    if (isArraryType(valueType)) {
      return `${this.valueTransformer.convertValueType(valueType.elementType)}Array`;
    }

    if (isDictionaryType(valueType)) {
      let keyType: string;
      switch (valueType.keyType) {
        case DictionaryKeyType.string:
          keyType = 'String';
          break;
        case DictionaryKeyType.number:
          keyType = 'Int';
          break;
        default:
          throw Error('Type not exists');
      }

      return `${this.valueTransformer.convertValueType(valueType.valueType)}For${keyType}Dictionary`;
    }

    return this.valueTransformer.convertValueType(valueType);
  }

  get members(): {
    capitalizeName: string,
    uncapitalizeName: string,
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
        const memberName = this.convertValueTypeToUnionMemberName(member);
        return {
          capitalizeName: capitalize(memberName),
          uncapitalizeName: uncapitalize(memberName),
          type: typeName,
          first: index === 0,
          last: index === members.length - 1,
        };
      });
  }
}
