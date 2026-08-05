import { assertEquals } from "@std/assert";
import {
  binOp,
  call,
  expr,
  ident,
  listOf,
  number,
  program,
} from "../src/parse.ts";
import { CURSOR } from "../src/parser/index.ts";

Deno.test(function exprTest() {
  assertEquals(
    expr()("34.+(12)", CURSOR),
    {
      ok: true,
      value: {
        result: { ident: "+", args: [34, 12] },
        remainder: "",
        cursor: { row: 0, col: 8, total: 8 },
      },
    },
  );
  assertEquals(
    expr()("foo.=(bar)", CURSOR),
    {
      ok: true,
      value: {
        result: { ident: "=", args: ["foo", "bar"] },
        remainder: "",
        cursor: { row: 0, col: 10, total: 10 },
      },
    },
  );
  assertEquals(
    expr()("1.?(0, 2)", CURSOR),
    {
      ok: true,
      value: {
        result: { ident: "?", args: [1, 0, 2] },
        remainder: "",
        cursor: { row: 0, col: 9, total: 9 },
      },
    },
  );
  assertEquals(
    expr()("a.sum(b, c, d)", CURSOR),
    {
      ok: true,
      value: {
        result: { ident: "sum", args: ["a", "b", "c", "d"] },
        remainder: "",
        cursor: { row: 0, col: 14, total: 14 },
      },
    },
  );
  assertEquals(
    expr()("1.+(2.*(3))", CURSOR),
    {
      ok: true,
      value: {
        result: { ident: "+", args: [1, { ident: "*", args: [2, 3] }] },
        remainder: "",
        cursor: { row: 0, col: 11, total: 11 },
      },
    },
  );
});

Deno.test(function identTest() {
  assertEquals(
    ident("hello world", CURSOR),
    {
      ok: true,
      value: {
        result: "hello",
        remainder: " world",
        cursor: { row: 0, col: 5, total: 5 },
      },
    },
  );
});

Deno.test(function listOfTest() {
  assertEquals(
    listOf(binOp)("=, +, *, -, /, push, pop, at", CURSOR),
    {
      ok: true,
      value: {
        result: [
          "=",
          "+",
          "*",
          "-",
          "/",
          "push",
          "pop",
          "at",
        ],
        remainder: "",
        cursor: { row: 0, col: 28, total: 28 },
      },
    },
  );
});

Deno.test(function numberTest() {
  assertEquals(
    number("34.3", CURSOR),
    {
      ok: true,
      value: {
        result: 34.3,
        remainder: "",
        cursor: { row: 0, col: 4, total: 4 },
      },
    },
  );
  assertEquals(
    number("90.0", CURSOR),
    {
      ok: true,
      value: {
        result: 90.0,
        remainder: "",
        cursor: { row: 0, col: 4, total: 4 },
      },
    },
  );
  assertEquals(
    number("123", CURSOR),
    {
      ok: true,
      value: {
        result: 123,
        remainder: "",
        cursor: { row: 0, col: 3, total: 3 },
      },
    },
  );
  assertEquals(
    number("0", CURSOR),
    {
      ok: true,
      value: {
        result: 0,
        remainder: "",
        cursor: { row: 0, col: 1, total: 1 },
      },
    },
  );
});
