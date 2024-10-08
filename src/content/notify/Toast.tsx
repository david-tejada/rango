import { Bounce, Flip, Slide, ToastContainer, Zoom } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSetting } from "../settings/settingsManager";
import "./Toast.css";

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
			position={getSetting("toastPosition")}
			transition={transitions[getSetting("toastTransition")]}
		/>
	);
}
