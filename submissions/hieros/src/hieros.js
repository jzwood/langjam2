/*
Grammar:

STMT := SET_EXPR | NUM_EXPR
SET_EXPR := VAR NUM_EXPR
VAR := "𓊢𓂝𓇤"
NUM_EXPR := NUM | VAR | NUM_EXPR OP NUM_EXPR
OP := '𓂻' | '𓂽'
NUM := Ms 100Ks 10Ks Ks 100s 10s 1s | ZERO
Ms := ε | '𓁏' Ms
100Ks := ε | '𓆐' 100Ks
10Ks := ε | '𓂭' 10Ks | '𓂮' | '𓂯' | ... | '𓂵'
Ks := ε | '𓆼' Ks | '𓆽' | ... | '𓇄'
100s := ε | '𓍢' 100s | '𓍣' | '𓍤' | ... | '𓍪'
10s := ε | '𓎆' 10s | '𓎇' | '𓎏' | '𓎈' | '𓎐' | ... | '𓎎'
1s := ε | '𓏺' 1s | '𓏻' | '𓏼' | ... | '𓐂'
ZERO := '𓄤'
*/

function tokenizer(rawInput) {
	let current = 0;
	const tokens = [];
	const input = [...rawInput.replace(' ', '')]; // spread required for UTF-16 surrogate-pair support
	while (current < input.length) {
		let currChar = input[current];
		switch (currChar) {
			case '𓊢':
				if (input.length < current + 3 || input[current+1] !== '𓂝' || input[current+2] !== '𓇤')
					throw new Error(`Unrecognized keyword: ${input.slice(current, 3)}`);
				tokens.push({ type: 'VAR_NAME' });
				current += 3;
				break;
				
			case '𓂻':
				tokens.push({ type: 'OP', val: '𓂻' });
				current++;
				break;
				
			case '𓂽':
				tokens.push({ type: 'OP', val: '𓂽' });
				current++;
				break;
				
			case '𓄤':
				tokens.push({ type: 'NUM', val: '𓄤' });
				current++;
				break;
				
			default:
				let val = '';
				while (/[𓁏𓆐𓂭-𓂶𓆼-𓇄𓍢-𓍫𓎆-𓎒𓏺-𓐃]/u.test(currChar)) {
					val += currChar;
					currChar = input[++current];
				}
				if (val === '') {
					throw new Error(`Unrecognized char: ${input[current]}`);
				} else if (currChar === '𓄤') {
					throw new Error(`Invalid numeral: zero-value hieroglyph cannot be combined with other numeric hieroglyphs`);
				}
				tokens.push({ type: 'NUM', val });
		}
	}
	return tokens;
}

const OP_NAMES = { '𓂻': 'ADD', '𓂽': 'SUBTRACT' };

// use a map to allow numeric keys
const HIEROGLYPH_RANGES = new Map([
	[ 77903, { end: 77904, startingVal: 1000000, step: 1000000 }],
	[ 78224, { end: 78225, startingVal: 100000, step: 100000 }],
	[ 77997, { end: 78006, startingVal: 10000, step: 10000 }],
	[ 78006, { end: 78007, startingVal: 50000, step: 10000 }],
	[ 78268, { end: 78277, startingVal: 1000, step: 1000 }],
	[ 78690, { end: 78699, startingVal: 100, step: 100 }],
	[ 78699, { end: 78700, startingVal: 500, step: 100 }],
	[ 78726, { end: 78735, startingVal: 10, step: 10 }],
	[ 78735, { end: 78739, startingVal: 20, step: 10 }],
	[ 78842, { end: 78851, startingVal: 1, step: 1 }],
	[ 78851, { end: 78852, startingVal: 5, step: 1 }],
	[ 78116, { end: 78117, startingVal: 0, step: 0 }],
]);

function parser(tokens) {
	function hieroglyphsToArabicNumeral(input) {
		let result = 0;
		let smallestBaseNumeralSeen = Number.MAX_VALUE;
		for (const c of input) {
			for (const r of HIEROGLYPH_RANGES.entries()) {
				let currCodepoint = c.codePointAt(0);
				if (currCodepoint < r[0] || currCodepoint >= r[1].end)
					continue;
				if (smallestBaseNumeralSeen < r[1].step) {
					throw new Error(`Invalid numeral ${input}: hieroglyphs must be ordered largest to smallest`);
				} else {
					let extraGlyphCount = currCodepoint - r[0];
					result += r[1].startingVal + r[1].step * extraGlyphCount;
					smallestBaseNumeralSeen = Math.min(smallestBaseNumeralSeen, r[1].step);
					break;
				}
			}
		}
		return result;
	}

	let root = null;         // outermost node built so far
	let parentNode = null;       // op node still missing its .left
	let pending = null;      // subtree with no home yet
	let isAssignment = false;

	for (let i = tokens.length - 1; i >= 0; i--) {
		const token = tokens[i];
		switch (token.type) {
			case 'NUM':
				pending = { type: 'NUM', val: hieroglyphsToArabicNumeral(token.val) };
				break;

			case 'VAR_NAME':
				if (i === 0 && tokens.length > 1) {
					if (tokens[1].type !== 'NUM' && tokens[1].type !== 'VAR_NAME')
						throw new Error('Invalid operator syntax');
					isAssignment = true;
				} else {
					pending = { type: 'NUM', val: 'unknown_qty' };
				}
				break;

			case 'OP': {
				if (i > tokens.length - 2 || (tokens[i+1].type !== 'NUM' && tokens[i+1].type !== 'VAR_NAME'))
					throw new Error('Invalid operator syntax');
				const name = OP_NAMES[token.val];
				if (!name) throw new Error(`Unknown operator: ${token.val}`);

				const opNode = { type: 'OP', name, left: null, right: pending };
				if (parentNode) parentNode.left = opNode;
				else root = opNode;

				parentNode = opNode;
				pending = null;
				break;
			}
		}
	}

	// whatever is left over is the innermost left operand
	if (parentNode) parentNode.left = pending;
	else root = pending;

	return isAssignment ? { type: 'SET', val: root } : root;
}

// currently only tracks value of 𓊢𓂝𓇤 (multiple vars not supported)
const VARIABLES = {
	unknown_qty: 0
}

const ARABIC_TO_HIEROGLYPHS = new Map([
	[ 1000000, '𓁏' ],
	[ 100000, '𓆐' ],
	[ 10000, '𓂭' ],
	[ 1000, '𓆼' ],
	[ 100, '𓍢' ],
	[ 10, '𓎆' ],
	[ 1, '𓏺' ],
	[ 0, '𓄤' ],
]);

function interpreter(expr) {
	function doMath(expr) {
		switch (expr.type) {
			case "SET":
				VARIABLES.unknown_qty = doMath(expr.val);
				return VARIABLES.unknown_qty;
			case "OP":
				switch (expr.name) {
					case "ADD":
						return doMath(expr.left) + doMath(expr.right);
					case "SUBTRACT":
						return doMath(expr.left) - doMath(expr.right);
					default:
						throw new Error(`Unrecognized operator ${expr.name}`)
				}
			case "NUM":
				if (typeof expr.val === "string") {
					if (!Object.keys(VARIABLES).filter(k => k === expr.val)) {
						throw new Error(`Unrecognized variable ${expr.val}`);
					}
					return VARIABLES[expr.val];
				} else {
					return expr.val
				}
			default:
				throw new Error(`Unrecognized expression type ${expr.type}`)
		}
	}
	
	let arabicNumeralResult = doMath(expr);
	if (arabicNumeralResult < 0)
		throw new Error("Negative numbers not supported");
	
	const numeral_mappings = Array.from(ARABIC_TO_HIEROGLYPHS);
	const zero_mapping = numeral_mappings.pop();
	if (arabicNumeralResult === 0) {
		return zero_mapping[1];
	}
	
	let result = "";
	for (const [key, val] of numeral_mappings) {
		while (arabicNumeralResult >= key) {
			result += val;
			arabicNumeralResult -= key;
		}
	}
	return result;
}

module.exports = { tokenizer, parser, interpreter };

if (require.main === module) {
	const rl = require('node:readline').createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: '> ',
	});

	rl.prompt();
	rl.on('line', (line) => {
		line = line.trim();
		if (line) {
			try {
				console.log(interpreter(parser(tokenizer(line))));
			} catch (e) {
				console.log(e.message);
			}
		}
		rl.prompt();
	});
}