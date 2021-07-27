//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

import UIKit
import WebKit

class ViewController: UIViewController {
  private lazy var webView: WKWebView = {
    let webView = WebView()
    webView.translatesAutoresizingMaskIntoConstraints = false

    let toolbar = Toolbar()
    toolbar.delegate = self

    webView.toolbar = toolbar

    return webView
  }()

  private lazy var editorBridge = IEditor(webView: webView)

  override func viewDidLoad() {
    super.viewDidLoad()
    // Do any additional setup after loading the view.

    view.backgroundColor = .systemBackground

    view.addSubview(webView)

    NSLayoutConstraint.activate([
      webView.topAnchor.constraint(equalTo: view.topAnchor),
      webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])

    loadJavaScriptBundle()
  }
}

extension ViewController: ToolbarDelegate {
  func toolbarDidToggleBold() {
    editorBridge.toggleBold { [unowned self] result in
      self.handleVoidResult(result)
    }
  }

  func toolbarDidToggleItalic() {
    editorBridge.toggleItalic { [unowned self] result in
      self.handleVoidResult(result)
    }
  }

  func toolbarDidToggleUnderline() {
    editorBridge.toggleUnderline { [unowned self] result in
      self.handleVoidResult(result)
    }
  }

  func toolbarDidTapInsertContent() {
    editorBridge.insertContent(
      content: "did tap insert content",
      newLine: true
    ) { result in
      switch result {
      case .success(let contentString):
        print("[ts-codegen] contentString after insertContent(): \(contentString)")
      case .failure(let error):
        assertionFailure("\(error)")
      }
    }
  }
}

private extension ViewController {
  func loadJavaScriptBundle() {
    let bundleURL = Bundle.main.url(forResource: "bundle", withExtension: "html")!
    let javaScriptContent = try! String(contentsOf: bundleURL, encoding: .utf8)

    webView.loadHTMLString(javaScriptContent, baseURL: nil)
  }

  func handleVoidResult(_ result: Result<Void, Error>) {
    switch result {
    case .success:
      break
    case .failure(let error):
      assertionFailure("\(error)")
    }
  }
}
