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

type ParseError = { err: string } | Cursor;
type Stream = null; // TODO
type Value = number | string | Value[] | Stream;
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
type Val = number | string | Expr[];
type Expr = Call | Val;
type Func = { ident: string; params: string[]; scope: Scope };
type Program = { funcs: Func[]; main: Scope };
*/

type VarMap = [string, Value][];

function evalVars(vars: Var[], funcs: Func[]): EvalResult<VarMap> {
  return vars.reduce<EvalResult<VarMap>>(
    (varmapres, { ident, expr }) =>
      Result.bind(varmapres, (varmap) =>
        Result.map(
          evalExpr(expr, varmap, funcs),
          (value) => [[ident, value], ...varmap],
        )),
    Result.ok([] as VarMap),
  );
}

function evalExpr(
  expr: Expr,
  varmap: VarMap,
  funcs: Func[],
): EvalResult<Value> {
  return Result.ok(0);
}

const src = `
replace double(x) with {
  x.*(2)
}

main {
  4.23.double()
}
`;
