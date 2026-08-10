const { tokenizer, parser, interpreter } = require('./hieros');

const STMT = "𓊢𓂝𓇤𓎇𓂻𓍢𓍢𓂽𓎈𓐂";
const STMT_TOKENS = [
	{ type: 'VAR_NAME' },
	{ type: 'NUM', val: '𓎇' },
	{ type: 'OP', val: '𓂻' },
	{ type: 'NUM', val: '𓍢𓍢' },
	{ type: 'OP', val: '𓂽' },
	{ type: 'NUM', val: '𓎈𓐂' },
];
const STMT_AST = {
	type: "SET",
	val: {
		type: "OP",
		name: "SUBTRACT",
		left: {
			type: "OP",
			name: "ADD",
			left: {
				type: "NUM",
				val: 20
			},
			right: {
				type: "NUM",
				val: 200
			},
		},
		right: {
			type: "NUM",
			val: 39
		}
	}
};
const STMT_RESULT = '𓍢𓎆𓎆𓎆𓎆𓎆𓎆𓎆𓎆𓏺'

console.log("Running tests");
console.assert(JSON.stringify(tokenizer(STMT)) === JSON.stringify(STMT_TOKENS));
console.assert(JSON.stringify(parser(STMT_TOKENS)) === JSON.stringify(STMT_AST));
console.assert(interpreter(STMT_AST) === STMT_RESULT);
console.log("Done");