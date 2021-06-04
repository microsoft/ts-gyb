//
//  Copyright 2013-2018 Microsoft Inc.
//

// swiftformat:disable redundantRawValues
// Don't modify this file manually, it's auto generated.

public class IImageOptionApi {
  let jsExecutor: BridgeJSExecutor

  init(jsExecutor: BridgeJSExecutor) {
    self.jsExecutor = jsExecutor
  }

  public func hideElementWithID(id: String, completion: BridgeJSExecutor.Completion? = nil) {
    struct Args: Encodable {
      let id: String
    }
    let args = Args(
      id: id
    )
    jsExecutor.execute(with: "", feature: "hideElementWithID", args: args, completion: completion)
  }

  public func restoreElementVisibilityWithID(id: String, completion: BridgeJSExecutor.Completion? = nil) {
    struct Args: Encodable {
      let id: String
    }
    let args = Args(
      id: id
    )
    jsExecutor.execute(with: "", feature: "restoreElementVisibilityWithID", args: args, completion: completion)
  }

  public func getSourceOfImageWithID(id: String, completion: @escaping BridgeCompletion<String?>) {
    struct Args: Encodable {
      let id: String
    }
    let args = Args(
      id: id
    )
    jsExecutor.execute(with: "", feature: "getSourceOfImageWithID", args: args, completion: completion)
  }

  public func getImageDataList(completion: @escaping BridgeCompletion<String>) {
    jsExecutor.execute(with: "", feature: "getImageDataList", args: nil, completion: completion)
  }

  public func getContentBoundsOfElementWithID(id: String, completion: @escaping BridgeCompletion<String?>) {
    struct Args: Encodable {
      let id: String
    }
    let args = Args(
      id: id
    )
    jsExecutor.execute(with: "", feature: "getContentBoundsOfElementWithID", args: args, completion: completion)
  }
}
