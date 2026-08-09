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
        scope: { vars: [], expr: { kind: "call", ident: "*", args: ["a", 2] } },
      }],
      main: {
        vars: [
          {
            expr: {
              kind: "call",
              args: [
                8.8,
                {
                  kind: "call",
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
        kind: "call",
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
      kind: "call",
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
  resultIs(expr()("34.+(12)", CURSOR), {
    kind: "call",
    ident: "+",
    args: [34, 12],
  });
  resultIs(expr()("foo.=(bar)", CURSOR), {
    kind: "call",
    ident: "=",
    args: ["foo", "bar"],
  });
  resultIs(expr()("1.?(0, 2)", CURSOR), {
    kind: "call",
    ident: "?",
    args: [1, 0, 2],
  });
  resultIs(expr()("[1,2,3].@(2)", CURSOR), {
    kind: "call",
    ident: "@",
    args: [[1, 2, 3], 2],
  });
  resultIs(expr()("a.sum(b, c, d)", CURSOR), {
    kind: "call",
    ident: "sum",
    args: ["a", "b", "c", "d"],
  });
  resultIs(expr()("1.+(2.*(3))", CURSOR), {
    kind: "call",
    ident: "+",
    args: [1, { kind: "call", ident: "*", args: [2, 3] }],
  });
  resultIs(expr()("[1].?([1], [2,3])", CURSOR), {
    kind: "call",
    ident: "?",
    args: [[1], [1], [2, 3]],
  });
  resultIs(expr()("11.11.-(22.22)", CURSOR), {
    kind: "call",
    ident: "-",
    args: [11.11, 22.22],
  });
  resultIs(expr()("a.b(c.d(e))", CURSOR), {
    kind: "call",
    ident: "b",
    args: ["a", { kind: "call", ident: "d", args: ["c", "e"] }],
  });
  resultIs(expr()("0.a().b()", CURSOR), {
    kind: "call",
    ident: "b",
    args: [{ kind: "call", ident: "a", args: [0] }],
  });
  resultIs(expr()("1.*(2).+(3)", CURSOR), {
    kind: "call",
    ident: "+",
    args: [{ kind: "call", ident: "*", args: [1, 2] }, 3],
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
  resultIs(nonEmptyList(binOp)("=, +, *, -, /, push, pop, @, %", CURSOR), [
    "=",
    "+",
    "*",
    "-",
    "/",
    "push",
    "pop",
    "@",
    "%",
  ]);
});

Deno.test(function numberTest() {
  resultIs(number("34.3", CURSOR), 34.3);
  resultIs(number("90.0", CURSOR), 90.0);
  resultIs(number("123", CURSOR), 123);
  resultIs(number("0", CURSOR), 0);
});
