import * as Result from "./parser/result.ts";
import { compile, Expr, Func, Stream, Value, Var } from "./parse.ts";
import { Cursor } from "./parser/index.ts";

type ParseError = string | Cursor;
type EvalResult<T> = Result.Result<ParseError, T>;

export function evaluate(src: string): EvalResult<Value> {
  return Result.bind(
    compile(src),
    ({ result: { main, funcs } }) =>
      Result.bind(
        evalVars(main.vars, funcs),
        (varmap) => evalExpr(main.expr, varmap, funcs),
      ),
  );
}

type VarMap = [string, Value][];

function evalVars(
  vars: Var[],
  funcs: Func[],
  varmap: VarMap = [],
): EvalResult<VarMap> {
  return vars.reduce<EvalResult<VarMap>>(
    (varmapres, { ident, expr }) =>
      Result.bind(varmapres, (varmap) =>
        Result.map(
          evalExpr(expr, varmap, funcs),
          (value) => [[ident, value], ...varmap],
        )),
    Result.ok(varmap),
  );
}

function evalExpr(
  expr: Expr,
  varmap: VarMap,
  funcs: Func[],
): EvalResult<Value> {
  if (typeof expr === "string") {
    const value = varmap.find(([ident, _]) => expr === ident);
    return value ? Result.ok(value[1]) : Result.ok(expr);
  }
  if (typeof expr === "number") return Result.ok(expr);
  if (Array.isArray(expr)) {
    return Result.mapM(expr.map((expr) => evalExpr(expr, varmap, funcs)));
  }
  if (expr.kind === "call") {
    const { ident, args } = expr;
    return evalFunc(ident, args, varmap, funcs);
  }

  if (expr.kind === "stream") {
    return Result.ok(expr);
  }

  assertNever(expr);
}

function evalFunc(
  ident: string,
  args: Expr[],
  varmap: VarMap,
  funcs: Func[],
): EvalResult<Value> {
  const arity = args.length;
  const func = funcs.find((func) =>
    func.ident === ident && func.params.length === arity
  );
  if (!func) {
    return evalBuiltIn(ident, args, varmap, funcs);
  }

  const vars: Var[] = func.params.map((param, i) => ({
    ident: param,
    expr: args[i],
  }))
    .concat(func.scope.vars);

  return Result.bind(
    evalVars(vars, funcs, varmap),
    (varmap) => evalExpr(func.scope.expr, varmap, funcs),
  );
}

function evalBuiltIn(
  ident: string,
  exprs: Expr[],
  varmap: VarMap,
  funcs: Func[],
): EvalResult<Value> {
  if (![2, 3].includes(exprs.length)) {
    return Result.err(`could not find function that matched "${ident}"`);
  }
  return Result.bind(
    Result.mapM(exprs.map((expr) => evalExpr(expr, varmap, funcs))),
    (values) => {
      const [v1, v2, v3] = values;
      if (ident === "=") {
        return Result.ok(Number(JSON.stringify(v1) === JSON.stringify(v2)));
      } else if (ident === "/=") {
        return Result.ok(Number(JSON.stringify(v1) !== JSON.stringify(v2)));
      } else if (ident === ">=") {
        return Result.ok(Number(v1 >= v2));
      } else if (ident === ">") {
        return Result.ok(Number(v1 > v2));
      } else if (ident === "<=") {
        return Result.ok(Number(v1 <= v2));
      } else if (ident === "<") {
        return Result.ok(Number(v1 < v2));
      } else if (ident === "|") {
        return Result.ok(Number(v1 || v2));
      } else if (ident === "&") {
        return Result.ok(Number(v1 && v2));
      } else if (ident === "+" && isNum(v1) && isNum(v2)) {
        return Result.ok(v1 + v2);
      } else if (ident === "*" && isNum(v1) && isNum(v2)) {
        return Result.ok(v1 * v2);
      } else if (ident === "-" && isNum(v1) && isNum(v2)) {
        return Result.ok(v1 - v2);
      } else if (ident === "/" && isNum(v1) && isNum(v2)) {
        return Result.ok(v1 / v2);
      } else if (ident === "%" && isNum(v1) && isNum(v2)) {
        return Result.ok(v1 % v2);
      } else if (ident === "@" && Array.isArray(v1) && isNum(v2)) {
        return -v1.length <= v2 && v2 < v1.length
          ? Result.ok(v1.at(v2) as Value)
          : Result.err("index out of bounds");
      } else if (ident === "push" && Array.isArray(v1)) {
        return Result.ok([...v1, v2]);
      } else if (ident === "take" && isStream(v1) && isNum(v2)) {
        return iterateN(v1, funcs, v2 - 1);
      } else if (ident === "while" && isStream(v1) && typeof v2 === "string") {
        return iterateUntil(v1, funcs, v2);
      } else if (ident === "iterate" && typeof v2 === "string") {
        const func = funcs.find((f) => f.ident === v2 && f.params.length === 1);
        return func
          ? Result.ok({ kind: "stream", func, seed: v1 })
          : Result.err(`could not find function that matched "${v2}"`);
      } else if (ident === "neg" && isNum(v1)) {
        return Result.ok(-1 * v1);
      } else if (ident === "length" && Array.isArray(v1)) {
        return Result.ok(v1.length);
      } else if (ident === "pop" && Array.isArray(v1)) {
        return Result.ok(v1.slice(0, -1));
      } else if (ident === "?" && isNum(v1)) {
        return Result.ok(v1 ? v2 : v3);
      } else {
        return Result.err(
          `cannot evaluate ${ident}(${
            values.map((v) => JSON.stringify(v)).join(", ")
          })`,
        );
      }
    },
  );
}

function iterateN(
  { func, seed }: Stream,
  funcs: Func[],
  n: number,
): EvalResult<Value> {
  return Array(n).fill(0).reduce<EvalResult<Value>>(
    (acc, _) =>
      Result.bind(acc, (val) => evalFunc(func.ident, [val], [], funcs)),
    evalFunc(func.ident, [seed], [], funcs),
  );
}

function iterateUntil(
  { func, seed }: Stream,
  funcs: Func[],
  until: string,
): EvalResult<Value> {
  return Result.bind(
    evalFunc(until, [seed], [], funcs),
    (resume) =>
      !resume
        ? Result.ok(seed)
        : Result.bind(evalFunc(func.ident, [seed], [], funcs), (val) =>
          iterateUntil({ kind: "stream", func, seed: val }, funcs, until)),
  );
}

function isNum(value: Value): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStream(value: Value): value is Stream {
  if (Array.isArray(value)) return false;
  return typeof value === "object" && value.kind === "stream";
}

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
