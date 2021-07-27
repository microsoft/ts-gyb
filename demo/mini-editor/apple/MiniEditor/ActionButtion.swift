//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

import UIKit

class ActionButton: UIButton {
  var onTap: (() -> Void)?

  init(systemName: String, onTap: @escaping () -> Void) {

    super.init(frame: .zero)

    translatesAutoresizingMaskIntoConstraints = false

    self.onTap = onTap

    setImage(UIImage(systemName: systemName), for: .normal)
    addTarget(self, action: #selector(buttonDidTap), for: .touchUpInside)
  }

  override init(frame: CGRect) {
    super.init(frame: frame)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }
}

private extension ActionButton {
  @objc func buttonDidTap() {
    onTap?()
  }
}
