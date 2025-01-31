import { createRoot } from "react-dom/client";
import { store } from "../../common/storage/store";
import { App } from "./App";
import "./index.css";

const container = document.querySelector("#app")!;
const root = createRoot(container);

(async () => {
	const hasSeenSettingsPage = await store.get("hasSeenSettingsPage");
	root.render(<App hasSeenSettingsPage={hasSeenSettingsPage ?? false} />);
	if (!hasSeenSettingsPage) await store.set("hasSeenSettingsPage", true);
})();
