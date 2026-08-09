// src/parser/result.ts
function err(error) {
  return {
    ok: false,
    error
  };
}
function ok(value2) {
  return {
    ok: true,
    value: value2
  };
}
function map(result, fn) {
  return result.ok ? ok(fn(result.value)) : result;
}
function bind(result, fn) {
  return result.ok ? fn(result.value) : result;
}
function mapM(results) {
  return results.reduceRight((accRes, result) => bind(accRes, (acc) => map(result, (value2) => [
    value2,
    ...acc
  ])), ok([]));
}

// src/parser/parser.ts
var CURSOR = Object.freeze({
  row: 0,
  col: 0,
  total: 0
});
function satisfy(predicate) {
  return (input, cursor = CURSOR) => {
    const result = input.at(0);
    if (result != null && predicate(result)) {
      const remainder = input.slice(1);
      const { row, col, total } = cursor;
      const ncursor = result === "\n" ? {
        row: row + 1,
        col: 0,
        total: total + 1
      } : {
        row,
        col: col + 1,
        total: total + 1
      };
      return ok({
        result,
        cursor: ncursor,
        remainder
      });
    }
    return err(cursor);
  };
}
function map2(pa, fn) {
  return (input, cursor = CURSOR) => map(pa(input, cursor), (ok2) => ({
    result: fn(ok2.result),
    cursor: ok2.cursor,
    remainder: ok2.remainder
  }));
}
function bind2(pa, apb) {
  return (input, cursor = CURSOR) => bind(pa(input, cursor), (ok2) => apb(ok2.result)(ok2.remainder, ok2.cursor));
}
function pure(result) {
  return (input, cursor = CURSOR) => ok({
    result,
    cursor,
    remainder: input
  });
}
function map22(pa, pb, abc) {
  return bind2(pa, (a) => bind2(pb, (b) => pure(abc(a, b))));
}
function map3(pa, pb, pc, abcd) {
  return bind2(pa, (a) => bind2(pb, (b) => bind2(pc, (c) => pure(abcd(a, b, c)))));
}
function left(pa, pb) {
  return map22(pa, pb, (a, _) => a);
}
function right(pa, pb) {
  return map22(pa, pb, (_, b) => b);
}
function zeroOrMore(p) {
  return (input, cursor = CURSOR) => oneOf(oneOrMore(p), pure([]))(input, cursor);
}
function oneOrMore(p) {
  return (input, cursor = CURSOR) => map22(p, zeroOrMore(p), (x, xs) => [
    x,
    ...xs
  ])(input, cursor);
}
function zeroOrOne(p) {
  return oneOf(p, pure(null));
}
function oneOf(...pas) {
  return (input, cursor = CURSOR) => {
    const [p, ...ps] = pas;
    if (p == null) return err(cursor);
    const result = p(input, cursor);
    return result.ok ? result : oneOf(...ps)(input, cursor);
  };
}
function char(grapheme) {
  return satisfy((char2) => char2 === grapheme);
}
function word(str) {
  return map2(traverse(char, Array.from(str)), (chars) => chars.join(""));
}
function traverse(apb, xs) {
  return (input, cursor = CURSOR) => xs.reduceRight((acc, x) => map22(apb(x), acc, (y, ys) => [
    y,
    ...ys
  ]), pure([]))(input, cursor);
}

// src/parser/parser_utils.ts
function isDigit(grapheme) {
  return /^\d$/.test(grapheme);
}
function isWhitespace(grapheme) {
  return [
    " ",
    "	",
    "\n"
  ].includes(grapheme);
}
var integer = map2(oneOrMore(satisfy(isDigit)), (xs) => parseInt(xs.join(""), 10));
var someWhitespace = oneOrMore(satisfy(isWhitespace));
var anyWhitespace = zeroOrMore(satisfy(isWhitespace));
function isAlpha(grapheme) {
  return /^[a-zA-Z]$/.test(grapheme);
}
var alpha = satisfy(isAlpha);
function wrap(l, p, r) {
  return right(word(l), left(p, word(r)));
}
function trim(p) {
  return right(anyWhitespace, left(p, anyWhitespace));
}
function trimStart(p) {
  return right(anyWhitespace, p);
}
function trimEnd(p) {
  return left(p, anyWhitespace);
}

// src/parse.ts
function nonEmptyList(p, delim = ",") {
  return map22(p, zeroOrMore(right(right(char(delim), anyWhitespace), p)), (head, tail) => [
    head,
    ...tail
  ]);
}
function list(p, delim = ",") {
  return map2(zeroOrOne(nonEmptyList(p, delim)), (rs) => rs == null ? [] : rs);
}
var binOp = oneOf(char("="), char(">"), char("<"), char("|"), char("&"), char("+"), char("*"), char("-"), char("/"), char("%"), char("@"), word("push"), word("pop"), word("iterate"));
var ternOp = oneOf(char("?"), word("fold"));
var isAlpha2 = (grapheme) => /^[a-zA-Z]$/.test(grapheme);
var ident = map2(oneOrMore(satisfy(isAlpha2)), (graphemes) => graphemes.join(""));
var params = trim(nonEmptyList(ident));
var number = map22(integer, zeroOrOne(right(char("."), integer)), (whole, fractional) => Number(whole + "." + (fractional || 0)));
function value() {
  return oneOf(wrap("[", exprs(), "]"), number, ident);
}
function expr() {
  return (input, cursor = CURSOR) => map22(value(), zeroOrMore(call()), (value2, calls) => calls.reduce((expr2, { ident: ident2, args }) => ({
    kind: "call",
    ident: ident2,
    args: [
      expr2,
      ...args
    ]
  }), value2))(input, cursor);
}
function exprs() {
  return trim(list(expr()));
}
function call() {
  return (input, cursor = CURSOR) => right(trimStart(char(".")), oneOf(map22(binOp, wrap("(", expr(), ")"), (ident2, arg) => ({
    kind: "call",
    ident: ident2,
    args: [
      arg
    ]
  })), map22(ternOp, wrap("(", map3(trim(expr()), char(","), trim(expr()), (e1, _, e2) => [
    e1,
    e2
  ]), ")"), (ident2, args) => ({
    kind: "call",
    ident: ident2,
    args
  })), map22(ident, oneOf(map2(word("()"), () => []), wrap("(", exprs(), ")")), (ident2, args) => ({
    kind: "call",
    ident: ident2,
    args
  }))))(input, cursor);
}
function assignFunc() {
  return (input, cursor = CURSOR) => map3(right(right(word("replace"), someWhitespace), ident), left(wrap("(", params, ")"), trim(word("with"))), scope(), (ident2, params2, scope2) => ({
    ident: ident2,
    params: params2,
    scope: scope2
  }))(input, cursor);
}
function assignVar() {
  return map22(wrap("replace", trim(ident), "with"), trimStart(expr()), (ident2, expr2) => ({
    ident: ident2,
    expr: expr2
  }));
}
function scope() {
  return wrap("{", trim(map22(zeroOrMore(trimStart(assignVar())), trim(expr()), (vars, expr2) => ({
    vars,
    expr: expr2
  }))), "}");
}
var program = trim(map22(zeroOrMore(left(assignFunc(), someWhitespace)), right(trimEnd(word("main")), scope()), (funcs, main) => ({
  funcs,
  main
})));
var compile = (input) => program(input, CURSOR);

// src/eval.ts
function evaluate(src) {
  return bind(compile(src), ({ result: { main, funcs } }) => bind(evalVars(main.vars, funcs), (varmap) => evalExpr(main.expr, varmap, funcs)));
}
function evalVars(vars, funcs, varmap = []) {
  return vars.reduce((varmapres, { ident: ident2, expr: expr2 }) => bind(varmapres, (varmap2) => map(evalExpr(expr2, varmap2, funcs), (value2) => [
    [
      ident2,
      value2
    ],
    ...varmap2
  ])), ok(varmap));
}
function evalExpr(expr2, varmap, funcs) {
  if (typeof expr2 === "string") {
    const value2 = varmap.find(([ident2, _]) => expr2 === ident2);
    return value2 ? ok(value2[1]) : ok(expr2);
  }
  if (typeof expr2 === "number") return ok(expr2);
  if (Array.isArray(expr2)) {
    return mapM(expr2.map((expr3) => evalExpr(expr3, varmap, funcs)));
  }
  if (expr2.kind === "call") {
    const { ident: ident2, args } = expr2;
    return evalFunc(ident2, args, varmap, funcs);
  }
  if (expr2.kind === "stream") {
    return ok(expr2);
  }
  assertNever(expr2);
}
function evalFunc(ident2, args, varmap, funcs) {
  const arity = args.length;
  const func = funcs.find((func2) => func2.ident === ident2 && func2.params.length === arity);
  if (!func) {
    return evalBuiltIn(ident2, args, varmap, funcs);
  }
  const vars = func.params.map((param, i) => ({
    ident: param,
    expr: args[i]
  })).concat(func.scope.vars);
  return bind(evalVars(vars, funcs, varmap), (varmap2) => evalExpr(func.scope.expr, varmap2, funcs));
}
function evalBuiltIn(ident2, exprs2, varmap, funcs) {
  if (![
    2,
    3
  ].includes(exprs2.length)) {
    return err(`could not find function that matched "${ident2}"`);
  }
  return bind(mapM(exprs2.map((expr2) => evalExpr(expr2, varmap, funcs))), (values) => {
    const arity = values.length;
    const [t1, t2] = values.map(typeOf);
    if (arity === 2) {
      if (t1 === "number" && t2 === "number") {
        const v1 = values[0];
        const v2 = values[1];
        if (ident2 === "+") return ok(v1 + v2);
        if (ident2 === "-") return ok(v1 - v2);
        if (ident2 === "*") return ok(v1 * v2);
        if (ident2 === "/") return ok(v1 / v2);
        if (ident2 === "=") return ok(Number(v1 === v2));
        if (ident2 === "%") return ok(v1 % v2);
        if (ident2 === "<") return ok(Number(v1 < v2));
        if (ident2 === ">") return ok(Number(v1 > v2));
        if (ident2 === "|") return ok(v1 || v2);
        if (ident2 === "&") return ok(v1 && v2);
      } else if (ident2 === "@" && t1 === "array" && t2 === "number") {
        const v1 = values[0];
        const v2 = values[1];
        return v1.length ? ok(v1.at(v2)) : err("cannot pop an empty list");
      } else if ([
        "push",
        "pop"
      ].includes(ident2) && t1 === "array") {
        const v1 = values[0];
        const v2 = values[1];
        if (ident2 === "push") return ok([
          ...v1,
          v2
        ]);
        if (ident2 === "pop") return ok(v1.slice(0, -1));
      } else if (ident2 === "iterate" && [
        "number",
        "array"
      ].includes(t1) && t2 === "string") {
        const val = values[0];
        const name = values[1];
        const func = funcs.find((func2) => func2.ident === name && func2.params.length === 1);
        if (func) {
          return ok({
            kind: "stream",
            func,
            seed: val
          });
        }
      } else if (ident2 === "take" && t1 == "object" && t2 === "number") {
        const { func, seed } = values[0];
        const num = values[1];
        return Array(num - 1).fill(0).reduce((acc, _) => bind(acc, (val) => evalFunc(func.ident, [
          val
        ], [], funcs)), evalFunc(func.ident, [
          seed
        ], [], funcs));
      }
    }
    return err(`could not find function that matched "${ident2}"`);
  });
}
function typeOf(x) {
  if (Array.isArray(x)) return "array";
  return typeof x;
}
function assertNever(x) {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

// src/index.ts
var src_default = evaluate;
export {
  src_default as default
};
