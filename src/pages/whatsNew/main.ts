import { store } from "../../common/storage/store";

(async () => {
	await store.remove("showWhatsNewPageNextStartup");
})();
