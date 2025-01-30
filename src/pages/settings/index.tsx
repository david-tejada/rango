import { createRoot } from "react-dom/client";
import { settings } from "../../common/settings/settings";
import { App } from "./App";
import "./index.css";

const container = document.querySelector("#app")!;
const root = createRoot(container);

(async () => {
	const hasSeenSettingsPage = await settings.get("hasSeenSettingsPage");
	root.render(<App hasSeenSettingsPage={hasSeenSettingsPage} />);
	await settings.set("hasSeenSettingsPage", true);
})();
