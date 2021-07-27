//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

import UIKit
import WebKit

class WebView: WKWebView {
  var toolbar: Toolbar?

  override var inputAccessoryView: UIView? {
    toolbar
  }
}
