//
//  UpdateRangoVersion.swift
//  Rango
//
//  Created by Nicholas Riley on 7/9/2022.
//

import Foundation
import System

struct Manifest: Codable {
    let version: String
}

let PROJECT_DIR = FilePath(CommandLine.arguments[0])
    .removingLastComponent()
    .removingLastComponent()

do {
    let manifestPath = PROJECT_DIR
        .appending("..")
        .appending("dist")
        .appending("safari")
        .appending("manifest.json")
        .string

    let manifestURL = URL(fileURLWithPath: manifestPath)
    let jsonData = try Data(contentsOf: manifestURL)
    let manifest = try JSONDecoder().decode(Manifest.self, from: jsonData)

    let xcconfigPath = PROJECT_DIR
        .appending("Build")
        .appending("RangoVersion.xcconfig")
        .string

    try "MARKETING_VERSION = \(manifest.version)\n"
        .write(toFile: xcconfigPath, atomically: false, encoding: .utf8)

    print("\u{001B}[32m[SUCCESS]\u{001B}[0m Updated Rango \u{001B}[3mMARKETING_VERSION\u{001B}[0m in \u{001B}[3m\(xcconfigPath)\u{001B}[0m to \(manifest.version)")
} catch {
    print("\u{001B}[31m[ERROR]\u{001B}[0m Failed to update version: \(error.localizedDescription)")
    exit(1)
}

