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
  public var stringUnion: OverriddenFullSizeMembersStringUnionType
  public var numberStringUnion: OverriddenFullSizeMembersNumberStringUnionType
  public var nullableStringUnion: OverriddenFullSizeMembersNullableStringUnionType?
  public var numUnion1: OverriddenFullSizeMembersNumUnion1Type
  public var foo: OverriddenFullSizeMembersFooType
  public var unionType: OverriddenFullSizeMembersUnionTypeType
  public var width: Double
  public var height: Double
  public var scale: Double
  /// Example documentation for member
  private var member: NumEnum = .one

  public init(size: Double, count: Int, stringEnum: StringEnum, numEnum: NumEnum, defEnum: DefaultEnum, stringUnion: OverriddenFullSizeMembersStringUnionType, numberStringUnion: OverriddenFullSizeMembersNumberStringUnionType, nullableStringUnion: OverriddenFullSizeMembersNullableStringUnionType?, numUnion1: OverriddenFullSizeMembersNumUnion1Type, foo: OverriddenFullSizeMembersFooType, unionType: OverriddenFullSizeMembersUnionTypeType, width: Double, height: Double, scale: Double) {
    self.size = size
    self.count = count
    self.stringEnum = stringEnum
    self.numEnum = numEnum
    self.defEnum = defEnum
    self.stringUnion = stringUnion
    self.numberStringUnion = numberStringUnion
    self.nullableStringUnion = nullableStringUnion
    self.numUnion1 = numUnion1
    self.foo = foo
    self.unionType = unionType
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

public enum OverriddenFullSizeMembersStringUnionType: String, Codable {
  case a1 = "A1"
  case b1 = "B1"
}

public enum OverriddenFullSizeMembersNumberStringUnionType: String, Codable {
  case _11 = "11"
  case _21 = "21"
}

public enum OverriddenFullSizeMembersNullableStringUnionType: String, Codable {
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

public enum OverriddenFullSizeMembersUnionTypeType: Codable {
  case numEnum(_ value: NumEnum)
  case defaultEnum(_ value: DefaultEnum)
  case bool(_ value: Bool)
  case double(_ value: Double)
  case string(_ value: String)

  public init(from decoder: any Decoder) throws {
    let container = try decoder.singleValueContainer()
    if let value = try? container.decode(NumEnum.self) {
      self = .numEnum(value)
    } 
    else if let value = try? container.decode(DefaultEnum.self) {
      self = .defaultEnum(value)
    } 
    else if let value = try? container.decode(Bool.self) {
      self = .bool(value)
    } 
    else if let value = try? container.decode(Double.self) {
      self = .double(value)
    } 
    else {
      let value = try container.decode(String.self)
      self = .string(value)
    }
  }

  public func encode(to encoder: any Encoder) throws {
    var container = encoder.singleValueContainer()
    switch self {
    case .numEnum(let value):
      try container.encode(value)
    case .defaultEnum(let value):
      try container.encode(value)
    case .bool(let value):
      try container.encode(value)
    case .double(let value):
      try container.encode(value)
    case .string(let value):
      try container.encode(value)
    }
  }
}
