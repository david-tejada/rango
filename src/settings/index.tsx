import { createRoot } from "react-dom/client";
import { retrieve, store } from "../common/storage";
import { App } from "./App";
import "./index.css";

const container = document.querySelector("#app")!;
const root = createRoot(container);

(async () => {
	const hasSeenSettingsPage = await retrieve("hasSeenSettingsPage");
	root.render(<App hasSeenSettingsPage={hasSeenSettingsPage} />);
	await store("hasSeenSettingsPage", true);
})();
