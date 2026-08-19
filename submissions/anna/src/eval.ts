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
      const arity = values.length;
      const [v1, v2, v3] = values;
      const [t1, t2, t3] = values.map(typeOf);

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
      } else if (ident === "+") {
        return Result.ok((v1 as number) + (v2 as number));
      } else if (ident === "*") {
        return Result.ok((v1 as number) * (v2 as number));
      } else if (ident === "-") {
        return Result.ok((v1 as number) - (v2 as number));
      } else if (ident === "/") {
        return Result.ok((v1 as number) / (v2 as number));
      } else if (ident === "%") {
        return Result.ok((v1 as number) % (v2 as number));
      } else if (ident === "@") {
        return Result.ok((v1 as Value[])[v2 as number]);
      } else if (ident === "push") {
        return Result.ok([...(v1 as Value[]), v2]);
      } else if (ident === "take") {
        const { func, seed } = v1 as Stream;
        const num = v2 as number;
        return Array(num - 1).fill(0).reduce<EvalResult<Value>>(
          (acc, _) =>
            Result.bind(acc, (val) => evalFunc(func.ident, [val], [], funcs)),
          evalFunc(func.ident, [seed], [], funcs),
        );
      } else if (ident === "while") {
        return Result.err("TODO");
      } else if (ident === "iterate") {
        const val = v1 as Value;
        const name = v2 as string;
        const func = funcs.find((func) =>
          func.ident === name && func.params.length === 1
        );
        if (func) {
          return Result.ok({ kind: "stream", func, seed: val });
        }
        return Result.err(`could not find function that matched "${name}"`);
      } else if (ident === "neg") {
        return Result.ok(-1 * (v1 as number));
      } else if (ident === "length") {
        return Result.ok((v1 as Value[]).length);
      } else if (ident === "pop") {
        return Result.ok((v1 as Value[]).slice(0, -1));
      } else if (ident === "?") {
        return Result.err("TODO");
      } else {
        return Result.err(`could not find function that matched "${ident}"`);
      }
    },
  );
}

function typeOf<T>(x: T): string {
  if (Array.isArray(x)) return "array";
  return typeof x;
}

function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}
