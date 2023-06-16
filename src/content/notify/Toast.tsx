import "react-toastify/dist/ReactToastify.css";
import { Bounce, Flip, Slide, ToastContainer, Zoom } from "react-toastify";
import "./Toast.css";
import { getCachedSetting } from "../settings/cacheSettings";

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
			position={getCachedSetting("toastPosition")}
			transition={transitions[getCachedSetting("toastTransition")]}
		/>
	);
}
