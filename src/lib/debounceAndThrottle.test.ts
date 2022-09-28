import { debounce, throttle } from "./debounceAndThrottle";

jest.useFakeTimers();

describe("debounce", () => {
	let callback: jest.Mock;
	let debouncedCallback: ReturnType<typeof debounce>;

	beforeEach(() => {
		callback = jest.fn();
		debouncedCallback = debounce(callback, 50);
	});

	test("It's only called once if we call several times before the debounce time completes", () => {
		debouncedCallback();
		jest.advanceTimersByTime(25);
		debouncedCallback();
		jest.advanceTimersByTime(25);
		debouncedCallback();
		jest.runAllTimers();

		expect(callback).toHaveBeenCalledTimes(1);
	});

	test("It's called several times if we exceed the debounce time when calling several times in succession", () => {
		debouncedCallback();
		jest.runAllTimers();
		debouncedCallback();
		jest.runAllTimers();

		expect(callback).toHaveBeenCalledTimes(2);
	});
});

describe("throttle", () => {
	let callback: jest.Mock;
	let throttledCallback: ReturnType<typeof throttle>;

	beforeEach(() => {
		callback = jest.fn();
		throttledCallback = throttle(callback, 50);
	});

	test("It's only called once if we call several times in succession before the throttle time exceeds", () => {
		throttledCallback();
		throttledCallback();
		jest.runAllTimers();

		expect(callback).toHaveBeenCalledTimes(1);
	});

	test("It's called if we exceed the throttled time", () => {
		throttledCallback();
		jest.advanceTimersByTime(25);
		throttledCallback();
		jest.advanceTimersByTime(25);
		// First call to call back

		throttledCallback();
		jest.advanceTimersByTime(25);
		throttledCallback();
		jest.advanceTimersByTime(25);
		// Second call to call back

		expect(callback).toHaveBeenCalledTimes(2);
	});
});
