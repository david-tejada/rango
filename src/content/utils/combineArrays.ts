// From https://stackoverflow.com/a/51470002 with some modifications
export function combineArrays<T>(arrayOfArrays: T[][]): T[][] {
	// First, handle some degenerate cases...

	if (!arrayOfArrays) {
		// Or maybe we should toss an exception...?
		return [];
	}

	if (!Array.isArray(arrayOfArrays)) {
		// Or maybe we should toss an exception...?
		return [];
	}

	if (arrayOfArrays.length === 0) {
		return [];
	}

	for (const arrayOfArray of arrayOfArrays) {
		if (!Array.isArray(arrayOfArray) || arrayOfArray.length === 0) {
			// If any of the arrays in arrayOfArrays are not arrays or zero-length, return an empty array...
			return [];
		}
	}

	// Done with degenerate cases...

	// Start "odometer" with a 0 for each array in arrayOfArrays.
	const length = arrayOfArrays.length;
	const odometer: number[] = Array.from({ length });
	odometer.fill(0);

	const output: T[][] = [];

	let newCombination = formCombination(odometer, arrayOfArrays);

	output.push(newCombination);

	while (odometerIncrement(odometer, arrayOfArrays)) {
		newCombination = formCombination(odometer, arrayOfArrays);
		output.push(newCombination);
	}

	return output;
}

// Translate "odometer" to combinations from arrayOfArrays
function formCombination<T>(odometer: number[], arrayOfArrays: T[][]): T[] {
	const output: T[] = [];

	for (const [i, element] of odometer.entries()) {
		output.push(arrayOfArrays[i]![element]!);
	}

	return output;
}

function odometerIncrement<T>(odometer: number[], arrayOfArrays: T[][]) {
	// Basically, work you way from the rightmost digit of the "odometer"...
	// if you're able to increment without cycling that digit back to zero,
	// you're all done, otherwise, cycle that digit to zero and go one digit to the
	// left, and begin again until you're able to increment a digit
	// without cycling it...simple, huh...?

	for (
		let iOdometerDigit = odometer.length - 1;
		iOdometerDigit >= 0;
		iOdometerDigit--
	) {
		const maxee = arrayOfArrays[iOdometerDigit]!.length - 1;

		if (odometer[iOdometerDigit]! + 1 <= maxee) {
			// Increment, and you're done...
			odometer[iOdometerDigit]++;
			return true;
		}

		if (iOdometerDigit - 1 < 0) {
			// No more digits left to increment, end of the line...
			return false;
		}

		// Can't increment this digit, cycle it to zero and continue
		// the loop to go over to the next digit...
		odometer[iOdometerDigit] = 0;
	}

	return false;
}
