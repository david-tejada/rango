export interface Message {
	type: "request" | "response";
	action?: {
		type: string;
		target: string | number;
	};
}
