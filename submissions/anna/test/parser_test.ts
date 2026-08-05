import { assertEquals } from "@std/assert";
import { binOp, listOf, number, program } from "../src/parse.ts";
import { CURSOR } from "../src/parser/index.ts";

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
