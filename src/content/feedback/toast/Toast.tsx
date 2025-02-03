import { Bounce, Flip, Slide, ToastContainer, Zoom } from "react-toastify";
import { settingsSync } from "../../settings/settingsSync";

const transitions = {
	slide: Slide,
	flip: Flip,
	zoom: Zoom,
	bounce: Bounce,
};

export function Toast() {
	return (
		<ToastContainer
			hideProgressBar
			closeOnClick
			draggable
			pauseOnHover
			pauseOnFocusLoss={false}
			autoClose={5000}
			newestOnTop={false}
			rtl={false}
			theme="light"
			position={settingsSync.get("toastPosition")}
			transition={transitions[settingsSync.get("toastTransition")]}
		/>
	);
}
