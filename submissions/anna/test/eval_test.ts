import { assertEquals } from "@std/assert";

import { evaluate } from "../src/eval.ts";

Deno.test(function evaluateTest() {
  let src = `
    replace double(x) with {
      x.*(2)
    }

    main {
      4.23.double()
    }
`;
  assertEquals({ ok: true, value: 8.46 }, evaluate(src));

  src = `
    replace incr(a) with {
      replace x with a
      replace y with x.-(0)
      y.+(1)
    }

    main {
      5
      .incr()
      .incr()
    }
`;
  assertEquals({ ok: true, value: 7 }, evaluate(src));

  src = `
    replace a(x) with {x}
    replace b(x) with {x}
    replace c(x) with {x}
    replace d(x) with {x}

    main {
      3.a().b()
    }
`;
  assertEquals({ ok: true, value: 3 }, evaluate(src));
});
