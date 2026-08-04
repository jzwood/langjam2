/*
X IDENT := a-z { a-z }
X SCOPE := '{' { ASSIGN_VAR } EXPR '}'
X ASSIGN_VAR := 'replace' IDENT 'with' (SCOPE | EXPR)
X PARAMS := IDENT { ',' IDENT } | ""
X ASSIGN_FUNC := 'replace' IDENT '(' PARAMS ')' SCOPE
  ITERATE := 'iterate' VALUE 'with' SCOPE 'until' SCOPE
X BIN_OPS := '=' | '+' | '*' | '-' | '/' | 'push' | 'pop' | 'at'
X TERN_OPS := '?'
X CALL := EXPR '.' [ BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
  EXPRS := EXPR { ',' EXPR } | ""
  LIST := '[' EXPRS ']'
  VALUE := NUMBER | IDENT | LIST
  EXPR := ITERATE | VALUE | CALL
  MAIN := 'main' '{' EXPR '}'
  PROGRAM := { ASSIGN_FUNC } MAIN

*/

import {
  anyWhitespace,
  char,
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

// TODO incorperate SCOPE into types and parsers

type Var = { ident: string; scope: Scope };
type Val = number | string; // or Expr[];
type Scope = { vars: Var[]; expr: Expr }; // or CALL or ITERATE
type Call = { ident: string; args: Expr[] };
type Expr = Val; // | Call
type Func = { ident: string; params: string[]; scope: Scope };
type Program = { funcs: Func[]; main: Expr };

const binOp: Parser<string> = oneOf(
  char("="),
  char("+"),
  char("*"),
  char("-"),
  char("/"),
  word("push"),
  word("pop"),
  word("at"),
);

const ternOp: Parser<string> = char("?");

function listOf<T>(p: Parser<T>, delim: string = ","): Parser<T[]> {
  return map2(
    p,
    oneOrMore(right(right(char(delim), anyWhitespace), p)),
    (head, tail) => [head, ...tail],
  );
}

const isAlpha = (grapheme: string): boolean => (/^[a-zA-Z]$/).test(grapheme);
const ident: Parser<string> = map(
  oneOrMore(satisfy(isAlpha)),
  (graphemes) => graphemes.join(""),
);
const params: Parser<string[]> = listOf(ident);

const number: Parser<number> = map2(
  integer,
  zeroOrOne(right(char("."), integer)),
  (whole, fractional) => Number(whole + "." + fractional),
);

const value: Parser<Val> = oneOf<Val>(ident, number); // TODO or Expr[]

// return oneOf(value, list, call)
const expr: Parser<Expr> = value;
const exprs: Parser<Expr[]> = oneOf(listOf(expr), pure([]));

function call(): Parser<Call> {
  return map2(
    left(expr, char(".")),
    oneOf(
      map2(
        binOp,
        wrap("(", expr, ")"),
        (ident, arg) => ({ ident, args: [arg] }),
      ),
      map2(
        ternOp,
        wrap(
          "(",
          map3(trim(expr), char(","), trim(expr), (e1, _, e2) => [e1, e2]),
          ")",
        ),
        (ident, args) => ({ ident, args }),
      ),
      map2(ident, wrap("(", exprs, ")"), (ident, args) => ({ ident, args })),
    ),
    (arg, { ident, args }) => ({ ident, args: [arg, ...args] }),
  );
}

function assignFunc(): Parser<Func> {
  return map3(
    right(right(word("replace"), someWhitespace), ident),
    wrap("(", trim(params), ")"),
    trimStart(scope()),
    (ident, params, scope) => ({ ident, params, scope }),
  );
}

function assignVar(): Parser<Var> {
  return map2(
    wrap("replace", trim(ident), "with"),
    trimStart(scope()),
    (ident, scope) => ({ ident, scope }),
  );
}

function scope(): Parser<Scope> {
  return wrap(
    "{",
    map2(zeroOrMore(assignVar()), expr, (vars, expr) => ({ vars, expr })),
    "}",
  );
}

const program: Parser<Program> = map2(
  zeroOrMore(left(assignFunc(), someWhitespace)),
  right(trimEnd(word("main")), wrap("{", expr, "}")),
  (funcs, main) => ({ funcs, main }),
);
