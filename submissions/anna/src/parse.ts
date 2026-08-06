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
  pure,
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
/*
X IDENT := a-z { a-z }
X SCOPE := '{' { ASSIGN_VAR } EXPR '}'
X ASSIGN_VAR := 'replace' IDENT 'with' EXPR
X PARAMS := IDENT { ',' IDENT } | ""
X ASSIGN_FUNC := 'replace' IDENT '(' PARAMS ')' SCOPE
  ITERATE := 'iterate' VALUE 'with' SCOPE 'until' SCOPE
X BIN_OPS := '=' | '+' | '*' | '-' | '/' | 'push' | 'pop' | 'at'
X TERN_OPS := '?'
X CALL := EXPR '.' [ BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
X EXPRS := EXPR { ',' EXPR } | ""
X VALUE := '[' EXPRS '] | NUMBER | IDENT;
/ EXPR := ITERATE | CALL | VALUE
  MAIN := 'main' '{' EXPR '}'
  PROGRAM := { ASSIGN_FUNC } MAIN
*/

type Var = { ident: string; expr: Expr };
type Scope = { vars: Var[]; expr: Expr };
type Call = { ident: string; args: Expr[] };
type Val = number | string | Expr[];
type Expr = Call | Val; // or iterate
type Func = { ident: string; params: string[]; scope: Scope };
type Program = { funcs: Func[]; main: Scope };

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
  char("+"),
  char("*"),
  char("-"),
  char("/"),
  word("push"),
  word("pop"),
  word("at"),
);

export const ternOp: Parser<string> = char("?");

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

export function value(): Parser<Val> {
  return oneOf<Val>(wrap("[", exprs(), "]"), number, ident);
}

export function expr(): Parser<Expr> {
  return (input: string, cursor: Cursor = CURSOR) =>
    oneOf<Expr>(call(value()), value(), call(expr()))(input, cursor); // iterate
}

export function exprs(): Parser<Expr[]> {
  return trim(list(expr()));
}

export function call(p: Parser<Expr>): Parser<Call> {
  return (input: string, cursor: Cursor = CURSOR) =>
    map2(
      left(p, char(".")),
      oneOf(
        map2(
          binOp,
          wrap("(", expr(), ")"),
          (ident, arg) => ({ ident, args: [arg] }),
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
          (ident, args) => ({ ident, args }),
        ),
        map2(
          ident,
          oneOf(map(word("()"), () => []), wrap("(", exprs(), ")")),
          (ident, args) => ({ ident, args }),
        ),
      ),
      (arg, { ident, args }) => ({ ident, args: [arg, ...args] }),
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

export const program: Parser<Program> = map2(
  zeroOrMore(left(assignFunc(), someWhitespace)),
  right(trimEnd(word("main")), scope()),
  (funcs, main) => ({ funcs, main }),
);
