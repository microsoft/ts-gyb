//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

// swiftformat:disable redundantRawValues
// Don't modify this file manually, it's auto generated.

import WebKit

public class EditorBridge {
  weak var webView: WKWebView?

  private let jsonEncoder = JSONEncoder()
  private let jsonDecoder = JSONDecoder()

  init(webView: WKWebView) {
    self.webView = webView
  }

  public func toggleBold(completion: ((Result<Void, Error>) -> Void)? = nil) {
    let javaScriptString = "editor.toggleBold" + "("  + ")"

    print("[ts-gyb] evaluating: \(javaScriptString)")

    webView?.evaluateJavaScript(javaScriptString) { evaluationResult, error in
      guard let completion = completion else { return }
      if let error = error {
        completion(.failure(error))
        return
      }
      completion(.success(()))
    }
  }

  public func toggleItalic(completion: ((Result<Void, Error>) -> Void)? = nil) {
    let javaScriptString = "editor.toggleItalic" + "("  + ")"

    print("[ts-gyb] evaluating: \(javaScriptString)")

    webView?.evaluateJavaScript(javaScriptString) { evaluationResult, error in
      guard let completion = completion else { return }
      if let error = error {
        completion(.failure(error))
        return
      }
      completion(.success(()))
    }
  }

  public func toggleUnderline(completion: ((Result<Void, Error>) -> Void)? = nil) {
    let javaScriptString = "editor.toggleUnderline" + "("  + ")"

    print("[ts-gyb] evaluating: \(javaScriptString)")

    webView?.evaluateJavaScript(javaScriptString) { evaluationResult, error in
      guard let completion = completion else { return }
      if let error = error {
        completion(.failure(error))
        return
      }
      completion(.success(()))
    }
  }

  public func clear(completion: ((Result<Void, Error>) -> Void)? = nil) {
    let javaScriptString = "editor.clear" + "("  + ")"

    print("[ts-gyb] evaluating: \(javaScriptString)")

    webView?.evaluateJavaScript(javaScriptString) { evaluationResult, error in
      guard let completion = completion else { return }
      if let error = error {
        completion(.failure(error))
        return
      }
      completion(.success(()))
    }
  }

  public func insertContent(content: String, newLine: Bool?, completion: @escaping (Result<InsertContentResult, Error>) -> Void) {
    struct Args: Encodable {
      let content: String
      let newLine: Bool?
    }
    let args = Args(
      content: content,
      newLine: newLine
    )
    let argsString = String(data: try! jsonEncoder.encode(args), encoding: .utf8)!
    let javaScriptString = "editor.insertContent" + "(" + "\(argsString)" + ")"

    print("[ts-gyb] evaluating: \(javaScriptString)")

    webView?.evaluateJavaScript(javaScriptString) { [unowned self]evaluationResult, error in
      if let error = error {
        completion(.failure(error))
        return
      }
      let data = try! JSONSerialization.data(withJSONObject: evaluationResult!)
      let result = try! self.jsonDecoder.decode(InsertContentResult.self, from: data)
      completion(.success(result))
    }
  }
}

public struct InsertContentResult: Codable {
  public var html: String

  public init(html: String) {
    self.html = html
  }
}
