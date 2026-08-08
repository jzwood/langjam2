import * as Result from "./parser/result.ts";
import {
  Call,
  compile,
  Expr,
  Func,
  Program,
  Scope,
  Val,
  Var,
} from "./parse.ts";
import { Cursor } from "./parser/index.ts";

type ParseError = string | Cursor;
type Stream = () => Value[];
type Value = number | Stream | Value[];
type EvalResult<T> = Result.Result<ParseError, T>;

function evaluate(src: string): EvalResult<Value> {
  return Result.bind(
    compile(src),
    ({ result: { main, funcs } }) =>
      Result.bind(
        evalVars(main.vars, funcs),
        (varmap) => evalExpr(main.expr, varmap, funcs),
      ),
  );
}

/*
type Var = { ident: string; expr: Expr };
type Scope = { vars: Var[]; expr: Expr };
type Call = { ident: string; args: Expr[] };
type Val = number | Expr[];
type Expr = Call | Val;
type Func = { ident: string; params: string[]; scope: Scope };
type Program = { funcs: Func[]; main: Scope };
*/

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
  if (typeof expr === "number") return Result.ok(expr);
  if (Array.isArray(expr)) {
    return Result.mapM(expr.map((expr) => evalExpr(expr, varmap, funcs)));
  }
  // implicitly typeof expr is CALL
  const { ident, args } = expr;
  return evalFunc(ident, args, varmap, funcs);
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
      const types = values.map((v) => typeof v);
      if (arity === 2 && types.every((t) => t === "number")) {
        const v1 = values[0] as number;
        const v2 = values[1] as number;
        if (ident === "+") return Result.ok(v1 + v2);
        if (ident === "-") return Result.ok(v1 - v2);
        if (ident === "*") return Result.ok(v1 * v2);
        if (ident === "/") return Result.ok(v1 / v2);
      }
      return Result.err(`could not find function that matched "${ident}"`);
    },
  );
}

const src = `
replace double(x) with {
  x.*(2)
}

main {
  4.23.double()
}
`;

const x = evaluate(src)
console.log(x)
