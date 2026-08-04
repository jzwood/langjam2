/*
X IDENT := a-z { a-z }
X ASSIGN_VAR := 'replace' IDENT 'with' (SCOPE | EXPR)
X ARGS := IDENT { ',' IDENT } | ""
X ASSIGN_FUNC := 'replace' IDENT '(' ARGS ')' SCOPE
  ITERATE := 'iterate' VALUE 'with' SCOPE 'until' SCOPE
X BIN_OPS := '=' | '+' | '*' | '-' | '/' | 'push' | 'pop' | 'at'
X TERN_OPS := '?'
  CALL := EXPR '.' [ '()' | BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
  EXPRS := EXPR { ',' EXPR } | ""
  LIST := '[' EXPRS ']'
X VALUE := NUMBER | IDENT | LIST
X EXPR := ITERATE | VALUE | CALL
X MAIN := 'main' '{' EXPR '}'
X PROGRAM := { ASSIGN_FUNC } MAIN

  SCOPE := '{' { ASSIGN_VAR } EXPR '}'
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
type Call = null // TODO
type Expr = Val | Call
type Func = { ident: string; args: string[]; expr: Expr };
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

const isAlpha = (grapheme: string): boolean => (/^[a-zA-Z]$/).test(grapheme);
const ident: Parser<string> = map(
  oneOrMore(satisfy(isAlpha)),
  (graphemes) => graphemes.join(""),
);
const args: Parser<string[]> = map2(
  ident,
  oneOrMore(right(right(char(","), anyWhitespace), ident)),
  (arg, args) => [arg, ...args],
);

const number: Parser<number> = map2(
  integer,
  zeroOrOne(right(char("."), integer)),
  (whole, fractional) => Number(whole + "." + fractional),
);

const assignVar: Parser<Var> = map2(
  wrap("replace", trim(ident), "with"),
  trimStart(wrap("{", expr(), "}")),
  (ident, expr) => ({ ident, expr }),
);

const assignFunc: Parser<Func> = map3(
  right(right(word("replace"), someWhitespace), ident),
  wrap("(", trim(args), ")"),
  trimStart(wrap("{", trim(expr()), "}")),
  (ident, args, expr) => ({ ident, args, expr }),
);

const value: Parser<Val> = oneOf<Val>(ident, number); // TODO or Expr[]

function expr(): Parser<Expr> {
  return map2(
    zeroOrMore(left(assignVar, someWhitespace)),
    value,
    (vars, value) => ({ vars, value }),
  );
}

const program: Parser<Program> = map2(
  zeroOrMore(left(assignFunc, someWhitespace)),
  right(trimEnd(word("main")), wrap("{", expr(), "}")),
  (funcs, main) => ({ funcs, main }),
);
