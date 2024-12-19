import { useEffect, useRef, useState } from "react";
import browser, { type Tabs } from "webextension-polyfill";
import { TabItem } from "./TabItem";

export function TabTree() {
	const [tabs, setTabs] = useState<Tabs.Tab[]>([]);
	const [activeTabId, setActiveTabId] = useState<number | undefined>(undefined);

	const ulRef = useRef<HTMLUListElement>(null);

	useEffect(() => {
		const populateTabs = async () => {
			const { id: windowId } = await browser.windows.getCurrent();
			const tabs = await browser.tabs.query({ windowId });
			const activeTabs = await browser.tabs.query({ active: true, windowId });

			setTabs(tabs);
			setActiveTabId(activeTabs[0]?.id);
		};

		browser.tabs.onActivated.addListener(async (activeInfo) => {
			console.log(activeInfo);
			setActiveTabId(activeInfo.tabId);
		});

		browser.tabs.onCreated.addListener(async (tab) => {
			console.log("onCreated", tab);
			setTabs((tabs) => [...tabs, tab]);
		});

		browser.tabs.onRemoved.addListener(async (tabId) => {
			console.log("onRemoved", tabId);
			setTabs((tabs) => tabs.filter((tab) => tab.id !== tabId));
		});

		browser.runtime.onMessage.addListener((message) => {
			if (message.destination === "sidebar" && message.name === "scrollTabs") {
				if (!ulRef.current) {
					return;
				}

				const { height } = ulRef.current.getBoundingClientRect();

				ulRef.current.scroll({
					top:
						ulRef.current.scrollTop +
						height * 0.9 * (message.direction === "up" ? -1 : 1),
					behavior: "instant",
				});
			}
		});

		void populateTabs();
	}, []);

	return (
		<ul
			ref={ulRef}
			className="grid p-2 gap-1 auto-rows-[32px] overflow-y-auto h-screen"
		>
			{tabs.map((tab) => (
				<TabItem key={tab.id} tab={tab} isActive={tab.id === activeTabId} />
			))}
		</ul>
	);
}
