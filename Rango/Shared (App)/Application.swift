//
//  Application.swift
//  Rango (macOS)
//
//  Created by Nicholas Riley on 6/18/2022.
//

import Cocoa
import os.log

class Application: NSApplication {

    override func showHelp(_ sender: Any?) {
        NSWorkspace.shared.open(URL(string: "https://github.com/david-tejada/rango#readme")!)
    }

}
