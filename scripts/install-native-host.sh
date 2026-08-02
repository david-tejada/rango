#!/usr/bin/env bash
# Registers the rango daemon as a native-messaging host for Chrome and/or
# Firefox, so the extension's background script can `connectNative()` to it.
#
# Usage:
#   scripts/install-native-host.sh --chrome-extension-id <id> [--browser chrome|firefox|all]
#
# Chrome requires the unpacked/installed extension's exact ID up front (it's
# random for unpacked dev builds unless the manifest pins a "key"); Firefox
# doesn't, since its manifest already declares a fixed
# browser_specific_settings.gecko.id ("rango@david-tejada").

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BROWSER="all"
CHROME_EXTENSION_ID=""

while [[ $# -gt 0 ]]; do
	case "$1" in
	--browser)
		BROWSER="$2"
		shift 2
		;;
	--chrome-extension-id)
		CHROME_EXTENSION_ID="$2"
		shift 2
		;;
	*)
		echo "Unknown argument: $1" >&2
		exit 1
		;;
	esac
done

DAEMON_PATH="$ROOT/daemon/index.ts"

install_manifest() {
	local template="$1"
	local dest_dir="$2"
	local generated="$3"

	sed -e "s|__DAEMON_PATH__|$DAEMON_PATH|g" \
		-e "s|__EXTENSION_ID__|$CHROME_EXTENSION_ID|g" \
		"$template" >"$generated"

	mkdir -p "$dest_dir"
	cp "$generated" "$dest_dir/com.rango.daemon.json"
	echo "Installed $dest_dir/com.rango.daemon.json"
}

chrome_dirs() {
	case "$(uname -s)" in
	Darwin)
		echo "$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
		;;
	Linux)
		echo "$HOME/.config/google-chrome/NativeMessagingHosts"
		;;
	*)
		echo "Unsupported OS for Chrome native messaging install: $(uname -s)" >&2
		return 1
		;;
	esac
}

firefox_dirs() {
	case "$(uname -s)" in
	Darwin)
		echo "$HOME/Library/Application Support/Mozilla/NativeMessagingHosts"
		;;
	Linux)
		echo "$HOME/.mozilla/native-messaging-hosts"
		;;
	*)
		echo "Unsupported OS for Firefox native messaging install: $(uname -s)" >&2
		return 1
		;;
	esac
}

mkdir -p "$ROOT/native-messaging/.generated"

if [[ "$BROWSER" == "chrome" || "$BROWSER" == "all" ]]; then
	if [[ -z "$CHROME_EXTENSION_ID" ]]; then
		echo "Pass --chrome-extension-id <id> to install the Chrome host (find it at chrome://extensions with Developer Mode on)." >&2
		exit 1
	fi

	install_manifest \
		"$ROOT/native-messaging/com.rango.daemon.chrome.json" \
		"$(chrome_dirs)" \
		"$ROOT/native-messaging/.generated/com.rango.daemon.chrome.json"
fi

if [[ "$BROWSER" == "firefox" || "$BROWSER" == "all" ]]; then
	install_manifest \
		"$ROOT/native-messaging/com.rango.daemon.firefox.json" \
		"$(firefox_dirs)" \
		"$ROOT/native-messaging/.generated/com.rango.daemon.firefox.json"
fi
