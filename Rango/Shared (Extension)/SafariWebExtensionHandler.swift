//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by Nicholas Riley on 6/5/2022.
//

import SafariServices
import os.log
import Foundation

let RangoExtensionRequestKey = "request"
let RangoExtensionRequestGetTextFromClipboard = "getTextFromClipboard"
let RangoExtensionRequestSetClipboardText = "setClipboardText"

let RangoExtensionError = "error"
let RangoExtensionTextFromClipboard = "textFromClipboard"
let RangoExtensionTextForClipboard = "textForClipboard"

enum PasteboardError: Error {
	case writingFailed
}

let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "")

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func textFromPasteboard() -> String? {
        return NSPasteboard.general.string(forType: .string)
    }

	func setTextOnPasteboard(_ text: String) throws {
		NSPasteboard.general.clearContents()
		guard NSPasteboard.general.setString(text, forType: .string) else {
			throw PasteboardError.writingFailed
		}
	}

    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        var response: Dictionary<String, Any> = [:]

        defer {
            logger.info("Response to Rango browser extension: \(response, privacy: .public)")
            let responseItem = NSExtensionItem()
            responseItem.userInfo = [ SFExtensionMessageKey: response ]
            context.completeRequest(returningItems: [responseItem], completionHandler: nil)
        }

        guard let message = item.userInfo?[SFExtensionMessageKey] as? Dictionary<String, String>
        else {
            response[RangoExtensionError] = "Message from extension of invalid type"
            return
        }

        logger.info("From Rango browser extension: \(message, privacy: .public)")

        guard let request = message[RangoExtensionRequestKey]
        else {
            response[RangoExtensionError] = "Message from extension contains no request"
            return
        }
        switch request {
        case RangoExtensionRequestGetTextFromClipboard:
            if let text = textFromPasteboard() {
                response[RangoExtensionTextFromClipboard] = text
            } else {
                response[RangoExtensionError] = "No text in clipboard"
            }
            return
		case RangoExtensionRequestSetClipboardText:
			if let textForClipboard = message[RangoExtensionTextForClipboard] {
				do {
					try setTextOnPasteboard(textForClipboard)
				} catch {
					response[RangoExtensionError] = "Failed to write text to clipboard"
				}
			} else {
				response[RangoExtensionError] = "No text for clipboard"
			}
        default:
            response[RangoExtensionError] = "Method from extension contains unknown request"
            return
        }
    }

}
