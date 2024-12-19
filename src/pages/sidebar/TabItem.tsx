import { useEffect, useRef, useState } from "react";
import browser, { type Tabs } from "webextension-polyfill";
import { getBareTitle } from "../../background/tabs/getBareTitle";
import { getTabMarker } from "../../background/tabs/tabMarkers";
import { urls } from "../../common/urls";

export function TabItem({
	tab,
	isActive,
}: {
	readonly tab: Tabs.Tab;
	readonly isActive: boolean;
}) {
	console.log("Tab details:", {
		id: tab.id,
		url: tab.url,
		favIconUrl: tab.favIconUrl,
		title: tab.title,
		status: tab.status,
	});

	const [title, setTitle] = useState("");
	const [tabMarker, setTabMarker] = useState("");
	const [favIconUrl, setFavIconUrl] = useState(tab.favIconUrl);
	const [showIcon, setShowIcon] = useState(true);

	const liRef = useRef<HTMLLIElement>(null);

	useEffect(() => {
		const getTitle = async () => {
			const bareTitle = await getBareTitle(tab.id);
			console.log("bareTitle", bareTitle, favIconUrl);
			setTitle(bareTitle);
			const tabMarker = await getTabMarker(tab.id!);
			setTabMarker(tabMarker);
		};

		if (isActive && liRef.current) {
			liRef.current?.scrollIntoView({ behavior: "instant", block: "center" });
		}

		browser.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
			console.log(changeInfo);
			if (tabId === tab.id && changeInfo.title) {
				console.log("onUpdated", tabId, changeInfo);
				const bareTitle = await getBareTitle(tabId);
				console.log("bareTitle", bareTitle);
				setTitle(bareTitle);
			}

			if (tabId === tab.id && changeInfo.favIconUrl) {
				setFavIconUrl(changeInfo.favIconUrl);
			}
		});

		void getTitle();
	}, [tab.id, favIconUrl, isActive]);

	return (
		<li
			ref={liRef}
			key={tab.id}
			className="flex flex-grow flex-shrink min-w-0 text-gray-700 min-h-[32px] h-[32px]"
		>
			<button
				type="button"
				className={`flex flex-grow min-w-0 h-full items-center gap-2 rounded-md overflow-hidden px-1 ${
					isActive ? "bg-violet-50" : ""
				}`}
				onClick={async () => {
					await browser.tabs.update(tab.id, { active: true });
				}}
			>
				<span className="flex-shrink-0 text-[12px] w-10 grid place-items-center h-6 border font-bold border-gray-200 rounded-md">
					{tabMarker ? tabMarker.toUpperCase() : "\u00A0"}
				</span>
				{favIconUrl && showIcon && (
					<img
						className="w-6 h-6 flex-shrink-0"
						src={favIconUrl || urls.icon48.href}
						onError={(e) => {
							console.log("Favicon load error for:", favIconUrl);
							setShowIcon(false);
						}}
					/>
				)}
				<span className="truncate min-w-0 text-[12px]">{title || tab.url}</span>
			</button>
		</li>
	);
}
