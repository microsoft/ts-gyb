//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

import UIKit
import WebKit

class WebView: WKWebView {
  override var inputAccessoryView: UIView? {
    Toolbar()
  }
}
