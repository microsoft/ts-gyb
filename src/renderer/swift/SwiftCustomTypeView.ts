import { CustomType } from "../../types";
import { CustomTypeView } from '../views';

export class SwiftCustomTypeView implements CustomTypeView {
  constructor(
    readonly typeName: string,
    private customType: CustomType,
  ) {}
}

