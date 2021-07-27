//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//

import UIKit

class Toolbar: UIView {
  private lazy var stackViewContainer: UIStackView = {
    let stackViewContainer = UIStackView(arrangedSubviews: [
      boldButton,
      italicButton,
      underlineButton,
    ])

    stackViewContainer.translatesAutoresizingMaskIntoConstraints = false

    stackViewContainer.spacing = 5.0
    stackViewContainer.distribution = .fillEqually

    return stackViewContainer
  }()

  private lazy var boldButton = buildButton(systemImage: "bold") { [weak self] in
    self?.toggleBold()
  }

  private lazy var italicButton = buildButton(systemImage: "italic") { [weak self] in
    self?.toggleItalic()
  }

  private lazy var underlineButton = buildButton(systemImage: "underline") { [weak self] in
    self?.toggleUnderline()
  }

  override init(frame: CGRect) {
    super.init(frame: frame)

    addSubview(stackViewContainer)

    NSLayoutConstraint.activate([
      stackViewContainer.topAnchor.constraint(equalTo: topAnchor),
      stackViewContainer.leadingAnchor.constraint(equalTo: leadingAnchor),
      stackViewContainer.trailingAnchor.constraint(equalTo: trailingAnchor),
      stackViewContainer.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])

    stackViewContainer.backgroundColor = .secondarySystemBackground

    configurateFrame()
    setNeedsLayout()
  }

  @available(*, unavailable)
  required init?(coder _: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    configurateFrame()
  }
}

private extension Toolbar {
  func buildButton(systemImage: String, onTap: @escaping () -> Void) -> UIButton {
    ActionButton(systemName: systemImage, onTap: onTap)
  }

  func toggleBold() {}

  func toggleItalic() {}
  func toggleUnderline() {}

  func configurateFrame() {
    frame = CGRect(x: 0, y: 0, width: UIScreen.main.bounds.width, height: 50)
  }
}
