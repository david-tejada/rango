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

let RangoExtensionError = "error"
let RangoExtensionTextFromClipboard = "textFromClipboard"

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func textFromPasteboard() -> String? {
        return NSPasteboard.general.string(forType: .string)
    }

    func beginRequest(with context: NSExtensionContext) {
        let item = context.inputItems[0] as! NSExtensionItem
        var response: Dictionary<String, Any> = [:]

        defer {
            os_log(.default, "Response to Rango browser extension: %{public}@", response as CVarArg)
            let responseItem = NSExtensionItem()
            responseItem.userInfo = [ SFExtensionMessageKey: response ]
            context.completeRequest(returningItems: [responseItem], completionHandler: nil)
        }

        guard let message = item.userInfo?[SFExtensionMessageKey] as? Dictionary<String, String>
        else {
            response[RangoExtensionError] = "Message from extension of invalid type"
            return
        }
        os_log(.default, "From Rango browser extension: %{public}@", message as CVarArg)

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
        default:
            response[RangoExtensionError] = "Method from extension contains unknown request"
            return
        }
    }

}
