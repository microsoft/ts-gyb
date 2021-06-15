//
//  Copyright 2013-2018 Microsoft Inc.
//

// swiftformat:disable redundantRawValues
// Don't modify this file manually, it's auto generated.

public class IHtmlApi {
  let jsExecutor: BridgeJSExecutor

  init(jsExecutor: BridgeJSExecutor) {
    self.jsExecutor = jsExecutor
  }

  /// This is a documentation
  /// Set Mention class names
  /// used to map id to class names
  public func setMentionClassNames(idToClassNames: [String: [String]], completion: BridgeJSExecutor.Completion? = nil) {
    struct Args: Encodable {
      let idToClassNames: [String: [String]]
    }
    let args = Args(
      idToClassNames: idToClassNames
    )
    jsExecutor.execute(with: "htmlApi", feature: "setMentionClassNames", args: args, completion: completion)
  }

  public func getHeight(completion: @escaping BridgeCompletion<Double>) {
    jsExecutor.execute(with: "htmlApi", feature: "getHeight", args: nil, completion: completion)
  }

  public func getHeightWithBottomAnchor(sta: [String], completion: @escaping BridgeCompletion<Double>) {
    struct Args: Encodable {
      let sta: [String]
    }
    let args = Args(
      sta: sta
    )
    jsExecutor.execute(with: "htmlApi", feature: "getHeightWithBottomAnchor", args: args, completion: completion)
  }

  public func getHTML(title: String, completion: @escaping BridgeCompletion<String>) {
    struct Args: Encodable {
      let title: String
    }
    let args = Args(
      title: title
    )
    jsExecutor.execute(with: "htmlApi", feature: "getHTML", args: args, completion: completion)
  }

  public func requestRenderingResult(completion: BridgeJSExecutor.Completion? = nil) {
    jsExecutor.execute(with: "htmlApi", feature: "requestRenderingResult", args: nil, completion: completion)
  }

  public func getSize(completion: @escaping BridgeCompletion<OverriddenFullSize>) {
    jsExecutor.execute(with: "htmlApi", feature: "getSize", args: nil, completion: completion)
  }

  public func getAliasSize(completion: @escaping BridgeCompletion<BaseSize>) {
    jsExecutor.execute(with: "htmlApi", feature: "getAliasSize", args: nil, completion: completion)
  }

  public func testDictionaryWithAnyKey(dict: [String: String], completion: BridgeJSExecutor.Completion? = nil) {
    struct Args: Encodable {
      let dict: [String: String]
    }
    let args = Args(
      dict: dict
    )
    jsExecutor.execute(with: "htmlApi", feature: "testDictionaryWithAnyKey", args: args, completion: completion)
  }
}

/// Example documentation for interface
public struct OverriddenFullSize: Codable {
  public var size: Double
  public var count: Int
  public var stringEnum: StringEnum
  public var numEnum: NumEnum
  public var defEnum: DefaultEnum
  public var width: Double
  public var height: Double
  public var scale: Double
  /// Example documentation for member
  private var member: NumEnum = .one

  public init(size: Double, count: Int, stringEnum: StringEnum, numEnum: NumEnum, defEnum: DefaultEnum, width: Double, height: Double, scale: Double) {
    self.size = size
    self.count = count
    self.stringEnum = stringEnum
    self.numEnum = numEnum
    self.defEnum = defEnum
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

public enum DefaultEnum: String, Codable {
  case c = "c"
  case d = "d"
}

public struct BaseSize: Codable {
  public var width: Double
  public var height: Double

  public init(width: Double, height: Double) {
    self.width = width
    self.height = height
  }
}
