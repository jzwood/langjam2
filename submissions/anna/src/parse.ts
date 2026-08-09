import {
  anyWhitespace,
  char,
  CURSOR,
  Cursor,
  integer,
  left,
  map,
  map2,
  map3,
  oneOf,
  oneOrMore,
  Parser,
  ParseResult,
  right,
  satisfy,
  someWhitespace,
  trim,
  trimEnd,
  trimStart,
  word,
  wrap,
  zeroOrMore,
  zeroOrOne,
} from "./parser/index.ts";

export type Var = { ident: string; expr: Expr };
export type Scope = { vars: Var[]; expr: Expr };
export type Call = { kind: "call"; ident: string; args: Expr[] };
export type Stream = { kind: "stream"; func: Func; seed: Value };
export type Value = number | Expr[] | string | Stream; // stream cannot be written explicitly
export type Expr = Call | Value;
export type Func = { ident: string; params: string[]; scope: Scope };
export type Program = { funcs: Func[]; main: Scope };

// HELPERS
export function nonEmptyList<T>(
  p: Parser<T>,
  delim: string = ",",
): Parser<T[]> {
  return map2(
    p,
    zeroOrMore(right(right(char(delim), anyWhitespace), p)),
    (head, tail) => [head, ...tail],
  );
}

export function list<T>(p: Parser<T>, delim: string = ","): Parser<T[]> {
  return map(zeroOrOne(nonEmptyList(p, delim)), (rs) => rs == null ? [] : rs);
}

// AST PARSERS
export const binOp: Parser<string> = oneOf(
  char("="),
  char(">"),
  char("<"),
  char("|"),
  char("&"),
  char("+"),
  char("*"),
  char("-"),
  char("/"),
  char("%"),
  char("@"),
  word("push"),
  word("pop"),
  word("iterate"),
);

export const ternOp: Parser<string> = oneOf(char("?"), word("fold"));

export const isAlpha = (grapheme: string): boolean =>
  (/^[a-zA-Z]$/).test(grapheme);
export const ident: Parser<string> = map(
  oneOrMore(satisfy(isAlpha)),
  (graphemes) => graphemes.join(""),
);
export const params: Parser<string[]> = trim(nonEmptyList(ident));

export const number: Parser<number> = map2(
  integer,
  zeroOrOne(right(char("."), integer)),
  (whole, fractional) => Number(whole + "." + (fractional || 0)),
);

export function value(): Parser<Value> {
  return oneOf<Value>(wrap("[", exprs(), "]"), number, ident);
}

export function expr(): Parser<Expr> {
  return (input: string, cursor: Cursor = CURSOR) =>
    map2(
      value(),
      zeroOrMore(call()),
      (value, calls) =>
        calls.reduce<Expr>(
          (expr, { ident, args }) => ({
            kind: "call",
            ident,
            args: [expr, ...args],
          }),
          value,
        ),
    )(input, cursor);
}

export function exprs(): Parser<Expr[]> {
  return trim(list(expr()));
}

export function call(): Parser<Call> {
  return (input: string, cursor: Cursor = CURSOR) =>
    right(
      trimStart(char(".")),
      oneOf(
        map2(
          binOp,
          wrap("(", expr(), ")"),
          (ident, arg) => ({ kind: "call", ident, args: [arg] } satisfies Call),
        ),
        map2(
          ternOp,
          wrap(
            "(",
            map3(
              trim(expr()),
              char(","),
              trim(expr()),
              (e1, _, e2) => [e1, e2],
            ),
            ")",
          ),
          (ident, args) => ({ kind: "call", ident, args } satisfies Call),
        ),
        map2(
          ident,
          oneOf(map(word("()"), () => []), wrap("(", exprs(), ")")),
          (ident, args) => ({ kind: "call", ident, args } satisfies Call),
        ),
      ),
    )(input, cursor);
}

export function assignFunc(): Parser<Func> {
  return (input: string, cursor: Cursor = CURSOR) =>
    map3(
      right(right(word("replace"), someWhitespace), ident),
      left(wrap("(", params, ")"), trim(word("with"))),
      scope(),
      (ident, params, scope) => ({ ident, params, scope }),
    )(input, cursor);
}

export function assignVar(): Parser<Var> {
  return map2(
    wrap("replace", trim(ident), "with"),
    trimStart(expr()),
    (ident, expr) => ({ ident, expr }),
  );
}

export function scope(): Parser<Scope> {
  return wrap(
    "{",
    trim(map2(
      zeroOrMore(trimStart(assignVar())),
      trim(expr()),
      (vars, expr) => ({ vars, expr }),
    )),
    "}",
  );
}

export const program: Parser<Program> = trim(map2(
  zeroOrMore(left(assignFunc(), someWhitespace)),
  right(trimEnd(word("main")), scope()),
  (funcs, main) => ({ funcs, main }),
));

export const compile = (input: string): ParseResult<Program> =>
  program(input, CURSOR);
