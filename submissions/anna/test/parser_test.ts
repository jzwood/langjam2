import { assertEquals, fail } from "@std/assert";

import {
  assignFunc,
  assignVar,
  binOp,
  expr,
  ident,
  nonEmptyList,
  number,
  program,
  scope,
} from "../src/parse.ts";
import { CURSOR, ParseResult } from "../src/parser/index.ts";

function resultIs<T>(actual: ParseResult<T>, expected: T) {
  if (actual.ok) {
    const result = actual.value.result;
    assertEquals(result, expected);
  } else {
    fail("parsing failed");
  }
}

Deno.test(function programTest() {
  resultIs(
    program(
      `replace double(a) with {
        a.*(2)
      }

        main {
          replace y with 8.8.=(4.4.double())
          y
        }
        `,
      CURSOR,
    ),
    {
      funcs: [{
        ident: "double",
        params: ["a"],
        scope: { vars: [], expr: { ident: "*", args: ["a", 2] } },
      }],
      main: {
        vars: [
          {
            expr: {
              args: [
                8.8,
                {
                  args: [
                    4.4,
                  ],
                  ident: "double",
                },
              ],
              ident: "=",
            },
            ident: "y",
          },
        ],
        expr: "y",
      },
    },
  );
});

Deno.test(function assignFuncTest() {
  resultIs(
    assignFunc()(
      `replace foo(a, b) with {
        replace i with 99

        [i, j, 5]
      }`,
      CURSOR,
    ),
    {
      ident: "foo",
      params: ["a", "b"],
      scope: {
        vars: [{ ident: "i", expr: 99 }],
        expr: ["i", "j", 5],
      },
    },
  );
});

Deno.test(function scopeTest() {
  resultIs(scope()("{ replace i with 99 [i, j, 5] }", CURSOR), {
    vars: [{ ident: "i", expr: 99 }],
    expr: ["i", "j", 5],
  });
  resultIs(
    scope()(
      `{
      replace a with b
      replace x with 0
      45.?(a, [x])
    }`,
      CURSOR,
    ),
    {
      vars: [
        { ident: "a", expr: "b" },
        { ident: "x", expr: 0 },
      ],
      expr: {
        ident: "?",
        args: [45, "a", ["x"]],
      },
    },
  );
});

Deno.test(function assignVarTest() {
  resultIs(assignVar()("replace hello with 9000", CURSOR), {
    ident: "hello",
    expr: 9000,
  });
  resultIs(assignVar()("replace foo with bar", CURSOR), {
    ident: "foo",
    expr: "bar",
  });
  resultIs(assignVar()("replace fizz with bar.bat(buzz)", CURSOR), {
    expr: {
      args: [
        "bar",
        "buzz",
      ],
      ident: "bat",
    },
    ident: "fizz",
  });
});

Deno.test(function exprTest() {
  resultIs(expr()("34.+(12)", CURSOR), { ident: "+", args: [34, 12] });
  resultIs(expr()("foo.=(bar)", CURSOR), { ident: "=", args: ["foo", "bar"] });
  resultIs(expr()("1.?(0, 2)", CURSOR), { ident: "?", args: [1, 0, 2] });
  resultIs(expr()("a.sum(b, c, d)", CURSOR), {
    ident: "sum",
    args: ["a", "b", "c", "d"],
  });
  resultIs(expr()("1.+(2.*(3))", CURSOR), {
    ident: "+",
    args: [1, { ident: "*", args: [2, 3] }],
  });
  resultIs(expr()("[1].?([1], [2,3])", CURSOR), {
    ident: "?",
    args: [[1], [1], [2, 3]],
  });
  resultIs(expr()("11.11.-(22.22)", CURSOR), {
    ident: "-",
    args: [11.11, 22.22],
  });
  resultIs(expr()("a.b(c.d(e))", CURSOR), {
    ident: "b",
    args: ["a", { ident: "d", args: ["c", "e"] }],
  });
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

Deno.test(function nonEmptyListTest() {
  resultIs(nonEmptyList(binOp)("=, +, *, -, /, push, pop, at", CURSOR), [
    "=",
    "+",
    "*",
    "-",
    "/",
    "push",
    "pop",
    "at",
  ]);
});

Deno.test(function numberTest() {
  resultIs(number("34.3", CURSOR), 34.3);
  resultIs(number("90.0", CURSOR), 90.0);
  resultIs(number("123", CURSOR), 123);
  resultIs(number("0", CURSOR), 0);
});
