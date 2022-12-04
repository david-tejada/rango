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

let manifestPath = PROJECT_DIR
    .appending("..")
    .appending("dist-mv2-safari")
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

