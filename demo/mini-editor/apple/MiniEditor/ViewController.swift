//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

import UIKit
import WebKit

class ViewController: UIViewController {
  private lazy var webView: WKWebView = {
    let webView = WKWebView()
    webView.translatesAutoresizingMaskIntoConstraints = false
    return webView
  }()

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

private extension ViewController {
  func loadJavaScriptBundle() {
    let bundleURL = Bundle.main.url(forResource: "bundle", withExtension: "html")!
    let javaScriptContent = try! String(contentsOf: bundleURL, encoding: .utf8)

    webView.loadHTMLString(javaScriptContent, baseURL: nil)
  }
}
