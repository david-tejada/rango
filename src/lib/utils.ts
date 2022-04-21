export function getLettersFromNumber(hintNumber: number): string {
	const codePointLowerA = 97;
	const lettersNumbers: number[] = [hintNumber];
	let result = "";
	let div: number;
	let sp = 0;

	// At the end of this while loop we will have an array with the numbers of the letters
	// from 0 (a) to 25 (z) in reversed order, for example: 35 -> [9, 0] -> ["j", "a"] -> "aj"
	while (sp < lettersNumbers.length) {
		if (lettersNumbers[sp]! > 25) {
			div = Math.floor(lettersNumbers[sp]! / 26);
			lettersNumbers[sp + 1] = div - 1;
			lettersNumbers[sp] %= 26;
		}

		sp += 1;
	}

	for (const letterNumber of lettersNumbers) {
		result = String.fromCodePoint(codePointLowerA + letterNumber) + result;
	}

	return result;
}
