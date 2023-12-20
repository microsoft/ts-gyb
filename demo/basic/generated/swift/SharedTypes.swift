//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

// swiftformat:disable redundantRawValues
// Don't modify this file manually, it's auto generated.

import UIKit

/// Example documentation for interface
public struct OverriddenFullSize: Codable {
  public var size: Double
  public var count: Int
  public var stringEnum: StringEnum
  public var numEnum: NumEnum
  public var defEnum: DefaultEnum
  public var stringUnion1: OverriddenFullSizeMembersStringUnion1Type
  public var numUnion1: OverriddenFullSizeMembersNumUnion1Type
  public var foo: OverriddenFullSizeMembersFooType
  public var width: Double
  public var height: Double
  public var scale: Double
  /// Example documentation for member
  private var member: NumEnum = .one

  public init(size: Double, count: Int, stringEnum: StringEnum, numEnum: NumEnum, defEnum: DefaultEnum, stringUnion1: OverriddenFullSizeMembersStringUnion1Type, numUnion1: OverriddenFullSizeMembersNumUnion1Type, foo: OverriddenFullSizeMembersFooType, width: Double, height: Double, scale: Double) {
    self.size = size
    self.count = count
    self.stringEnum = stringEnum
    self.numEnum = numEnum
    self.defEnum = defEnum
    self.stringUnion1 = stringUnion1
    self.numUnion1 = numUnion1
    self.foo = foo
    self.width = width
    self.height = height
    self.scale = scale
  }
}

public enum NumEnum: Int, Codable {
  case one = 1
  case two = 2
}

public enum StringEnum: String, Codable {
  /// Description for enum member a
  case a = "a"
  case b = "b"
}

public enum DefaultEnum: Int, Codable {
  case defaultValueC = 0
  case defaultValueD = 1
}

public enum OverriddenFullSizeMembersStringUnion1Type: String, Codable {
  case a1 = "A1"
  case b1 = "B1"
}

public enum OverriddenFullSizeMembersNumUnion1Type: Int, Codable {
  case _11 = 11
  case _21 = 21
}

public struct OverriddenFullSizeMembersFooType: Codable {
  public var stringField: String
  public var numberField: Double

  public init(stringField: String, numberField: Double) {
    self.stringField = stringField
    self.numberField = numberField
  }
}
