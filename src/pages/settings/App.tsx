import { Alert } from "./Alert";
import "./App.css";
import { SettingsComponent } from "./SettingsComponent";

// I can't use urls.iconSvg because importing urls would duplicate the image
// bundles, I think it has to do with jsx transpilation
const iconSvgUrl = new URL("../../assets/icon.svg", import.meta.url);

type AppProps = {
	readonly hasSeenSettingsPage: boolean;
};

export function App({ hasSeenSettingsPage }: AppProps) {
	return (
		<div className="App">
			<h1>
				<img className="rango-logo" src={iconSvgUrl.href} alt="" />
				Rango Settings
			</h1>
			{!hasSeenSettingsPage && (
				<Alert type="info">
					On this page we are unable to display hints. You can use <b>tab</b> to
					navigate through the settings. Use <b>space</b> or <b>enter</b> to
					toggle a setting and <b>up</b> or <b>down</b> to select a different
					option.
				</Alert>
			)}

			<SettingsComponent />
		</div>
	);
}
