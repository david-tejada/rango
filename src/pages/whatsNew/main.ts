import { store } from "../../common/storage/storage";

(async () => {
	await store("showWhatsNewPageNextStartup", false);
})();
