import "./App.css";
import { SettingsComponent } from "./SettingsComponent";

// I can't use urls.iconSvg because importing urls would duplicate the image
// bundles, I think it has to do with jsx transpilation
const iconSvgUrl = new URL("../assets/icon.svg", import.meta.url);

export function App() {
	return (
		<div className="App">
			<h1>
				<img src={iconSvgUrl.href} width="40px" alt="" /> Rango Settings
			</h1>
			<SettingsComponent />
		</div>
	);
}
