import { type LabelStack } from "../../../typings/LabelStack";
import { sendMessage } from "../../messaging/sendMessage";
import { getAllFrames } from "../../utils/getAllFrames";
import { reclaimLabelsFromOtherFrames } from "./labelAllocator";

let mockStack: LabelStack;

jest.mock("../../../common/storage/store", () => ({
	store: {
		async withLock(
			_key: string,
			callback: (stack: LabelStack) => Promise<[LabelStack, unknown?]>
		) {
			const [stack, result] = await callback(mockStack);
			mockStack = stack;
			return result;
		},
	},
}));

jest.mock("../../messaging/sendMessage", () => ({ sendMessage: jest.fn() }));
jest.mock("../../utils/getAllFrames", () => ({ getAllFrames: jest.fn() }));
jest.mock("./labelStack", () => ({ createStack: jest.fn() }));
jest.mock("./webNavigation", () => ({ navigationOccurred: jest.fn() }));

const mockSendMessage = jest.mocked(sendMessage);
const mockGetAllFrames = jest.mocked(getAllFrames);

function frames(...frameIds: number[]) {
	return frameIds.map((frameId) => ({ frameId })) as Awaited<
		ReturnType<typeof getAllFrames>
	>;
}

function unreachableFrameError() {
	return new Error(
		"Could not establish connection. Receiving end does not exist."
	);
}

beforeEach(() => {
	mockStack = { free: [], assigned: { a: 1, b: 2, c: 3 } };
	mockSendMessage.mockReset();
	mockGetAllFrames.mockReset();
});

test("a frame that has gone doesn't stop the others from giving up labels", async () => {
	mockGetAllFrames.mockResolvedValue(frames(0, 1, 2));
	mockSendMessage.mockImplementation((async (
		_messageId: string,
		_data: unknown,
		options: { frameId: number }
	) => {
		if (options.frameId === 1) throw unreachableFrameError();
		return ["b"];
	}) as typeof sendMessage);

	const reclaimed = await reclaimLabelsFromOtherFrames(1, 0, 1);

	expect(reclaimed).toEqual(["b"]);
	expect(mockStack.assigned).toEqual({ a: 1, b: 0, c: 3 });
});

test("a frame failing for another reason doesn't lose the labels already given up", async () => {
	mockGetAllFrames.mockResolvedValue(frames(0, 1, 2));
	mockSendMessage.mockImplementation((async (
		_messageId: string,
		_data: unknown,
		options: { frameId: number }
	) => {
		if (options.frameId === 2) throw new Error("Something else");
		return ["a"];
	}) as typeof sendMessage);

	const reclaimed = await reclaimLabelsFromOtherFrames(1, 0, 2);

	expect(reclaimed).toEqual(["a"]);
	expect(mockStack.assigned).toEqual({ a: 0, b: 2, c: 3 });
});
