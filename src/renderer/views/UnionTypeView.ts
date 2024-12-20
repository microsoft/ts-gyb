import { capitalize, uncapitalize } from "../../utils";
import { BasicType, DictionaryKeyType, DictionaryType, UnionType, ValueType, isArraryType, isBasicType, isDictionaryType } from '../../types';
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

    const dictionaryTypeMembers: DictionaryType[] = [];
    let basicTypeMembers: BasicType[] = [];
    const otherMembers: ValueType[] = [];

    members.forEach((member) => {
      if (isDictionaryType(member)) {
        dictionaryTypeMembers.push(member);
      } else if (isBasicType(member)) {
        basicTypeMembers.push(member);
      } else {
        otherMembers.push(member);
      }
    });

    basicTypeMembers = basicTypeMembers.sort((a, b) => {
      // put string to last
      if (a.value === 'string' && b.value === 'string') {
        return 0;
      }

      if (a.value === 'string') {
        return 1;
      }

      return -1;
    });

    const sortedMembers: ValueType[] = [...otherMembers, ...dictionaryTypeMembers, ...basicTypeMembers];
    return sortedMembers
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
