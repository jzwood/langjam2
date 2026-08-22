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

  src = `
    replace incr(n) with {
      1.+(n)
    }

    main {
      0.iterate(incr).take(5)
    }
`;
  assertEquals({ ok: true, value: 5 }, evaluate(src));

  src = `
    replace psh(arr) with {
      arr.push(1).push(2)
    }

    main {
      [].psh()
    }
`;
  assertEquals({ ok: true, value: [1, 2] }, evaluate(src));

  src = `
    replace psh(arr) with {
      arr.push(arr.@(0))
    }

    main {
      [3].iterate(psh).take(4)
    }
`;
  assertEquals({ ok: true, value: [3, 3, 3, 3, 3] }, evaluate(src));

  src = `
    replace rangenext(list) with {
      replace next with list.last().+(1)
      list.push(next)
    }

    replace last(list) with {
      list.@(list.length().-(1))
    }

    replace range(a, n) with {
      [a].iterate(rangenext).take(n.-(1))
    }

    main {
      3.range(4)
    }
  `;
  assertEquals({ ok: true, value: [3, 4, 5, 6] }, evaluate(src));

  src = `
    replace nextfib(list) with {
      replace penult with list.@(list.length().-(2))
      list.push(penult.+(list.last()))
    }
    replace fib(n) with {
      [1, 1].iterate(nextfib).take(n)
    }
    replace last(list) with {
      list.@(list.length().-(1))
    }

    main {
      5.fib()
    }
  `;
  assertEquals({ ok: true, value: [1, 1, 2, 3, 5, 8, 13] }, evaluate(src));

  src = `
    replace next(tuple) with {
      replace counter with tuple.@(0).-(1)
      replace result with tuple.@(1)
      [counter, result.*(counter)]
    }

    replace aboveone(tuple) with {
      tuple.@(0)./=(1)
    }

    replace factorial(x) with {
      [x, x].iterate(next).while(aboveone).@(1)
    }

    main {
      5.factorial()
    }
  `;
  assertEquals({ ok: true, value: 120 }, evaluate(src));

  src = `
    main {
      1.>(2).?(100, 50)
    }
  `;
  assertEquals({ ok: true, value: 50 }, evaluate(src));
});
