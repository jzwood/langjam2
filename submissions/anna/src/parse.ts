/*
X IDENT := a-z { a-z }
X ASSIGN_VAR := 'replace' IDENT 'with' '{' EXPR '}'
X ARGS := IDENT { ',' IDENT } | ""
  ASSIGN_FUNC := 'replace' IDENT '(' ARGS ')' '{' EXPR '}'
  ITERATE := 'iterate' VALUE 'with' '{' EXPR '}' 'until' '{' EXPR '}'
X BIN_OPS := '=' | '+' | '*' | '-' | '/' | 'push' | 'pop' | 'at'
X TERN_OPS := '?'
  CALL := EXPR '.' [ '()' | BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
  EXPRS := EXPR { ',' EXPR } | ""
  LIST := '[' EXPRS ']'
  VALUE := NUMBER | LIST | IDENT
  EXPR := ASSIGN_VAR EXPR | ITERATE | VALUE | CALL
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

type Var = { ident: string; expr: Expr };
type Val = number | string; // or Expr[];
type Expr = { vars: Var[]; value: Val }; // or CALL or ITERATE
type Func = { ident: string; args: string[]; expr: Expr };

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

function __x<A, B, C>(pa: Parser<A>, pb: Parser<B>, pc: Parser<C>): Parser<C> {
  return map3(pa, pb, pc, (_a, _b, c) => c);
}

const ternOp: Parser<string> = char("?");

const isAlpha = (grapheme: string): boolean => (/^[a-zA-Z]$/).test(grapheme);
const ident: Parser<string> = map(
  oneOrMore(satisfy(isAlpha)),
  (graphemes) => graphemes.join(""),
);
const args: Parser<string[]> = map2(
  ident,
  oneOrMore(__x(char(","), anyWhitespace, ident)),
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
  __x(word("replace"), someWhitespace, ident),
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
