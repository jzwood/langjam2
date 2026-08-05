import * as Result from "./result.ts";

export interface Cursor {
  row: number;
  col: number;
  total: number;
}

export const CURSOR: Cursor = Object.freeze({ row: 0, col: 0, total: 0 });

export type ParseOk<T> = { result: T; cursor: Cursor; remainder: string };
export type ParseError = Cursor;
export type Grapheme = string;
export type ParseResult<T> = Result.Result<ParseError, ParseOk<T>>;
export type Parser<T> = (
  input: string,
  cursor: Cursor,
) => ParseResult<T>;

export function satisfy(
  predicate: (grapheme: Grapheme) => boolean,
): Parser<Grapheme> {
  return (input: string, cursor: Cursor = CURSOR) => {
    const result = input.at(0);
    if (result != null && predicate(result)) {
      const remainder = input.slice(1);
      const { row, col, total } = cursor;
      const ncursor = result === "\n"
        ? { row: row + 1, col: 0, total: total + 1 }
        : { row, col: col + 1, total: total + 1 };
      return Result.ok({ result, cursor: ncursor, remainder });
    }
    return Result.err(cursor);
  };
}

// peek is special in that it does not consume any input
export function peek(): Parser<Grapheme> {
  return (input: string, cursor: Cursor = CURSOR) => {
    const result = input.at(0);
    return result != null
      ? Result.ok({ result, cursor, remainder: input })
      : Result.err(cursor);
  };
}

export function map<A, B>(pa: Parser<A>, fn: (result: A) => B): Parser<B> {
  return (input: string, cursor: Cursor = CURSOR) =>
    Result.map(pa(input, cursor), (ok: ParseOk<A>): ParseOk<B> => ({
      result: fn(ok.result),
      cursor: ok.cursor,
      remainder: ok.remainder,
    }));
}

export function bind<A, B>(pa: Parser<A>, apb: (a: A) => Parser<B>): Parser<B> {
  return (input: string, cursor: Cursor = CURSOR) =>
    Result.bind(
      pa(input, cursor),
      (ok) => apb(ok.result)(ok.remainder, ok.cursor),
    );
}

export function pure<A>(result: A): Parser<A> {
  return (input: string, cursor: Cursor = CURSOR) =>
    Result.ok({ result, cursor, remainder: input });
}

export function map2<A, B, C>(
  pa: Parser<A>,
  pb: Parser<B>,
  abc: (a: A, b: B) => C,
): Parser<C> {
  return bind(pa, (a) => bind(pb, (b) => pure(abc(a, b))));
}

export function map3<A, B, C, D>(
  pa: Parser<A>,
  pb: Parser<B>,
  pc: Parser<C>,
  abcd: (a: A, b: B, c: C) => D,
): Parser<D> {
  return bind(pa, (a) => bind(pb, (b) => bind(pc, (c) => pure(abcd(a, b, c)))));
}

export function left<A, B>(pa: Parser<A>, pb: Parser<B>): Parser<A> {
  return map2(pa, pb, (a, _) => a);
}

export function right<A, B>(pa: Parser<A>, pb: Parser<B>): Parser<B> {
  return map2(pa, pb, (_, b) => b);
}

export function zeroOrMore<T>(p: Parser<T>): Parser<T[]> {
  return (input: string, cursor: Cursor = CURSOR) =>
    oneOf(oneOrMore(p), pure([]))(input, cursor);
}

export function oneOrMore<T>(p: Parser<T>): Parser<T[]> {
  return (input: string, cursor: Cursor = CURSOR) =>
    map2(p, zeroOrMore(p), (x: T, xs: T[]) => [x, ...xs])(input, cursor);
}

export function zeroOrOne<T>(p: Parser<T>): Parser<T | null> {
  return oneOf(p, pure(null));
}

export function oneOf<A>(...pas: Parser<A>[]): Parser<A> {
  return (input: string, cursor: Cursor = CURSOR) => {
    const [p, ...ps] = pas;
    if (p == null) return Result.err(cursor);
    const result = p(input, cursor);
    return result.ok ? result : oneOf(...ps)(input, cursor);
  };
}

export function char(grapheme: Grapheme): Parser<Grapheme> {
  return satisfy((char) => char === grapheme);
}

export function word(str: string): Parser<string> {
  return map(traverse(char, Array.from(str)), (chars) => chars.join(""));
}

export function traverse<A, B>(apb: (x: B) => Parser<A>, xs: B[]): Parser<A[]> {
  return (input: string, cursor: Cursor = CURSOR) =>
    xs.reduceRight(
      (acc, x) => map2(apb(x), acc, (y: A, ys: A[]) => [y, ...ys]),
      pure<A[]>([]),
    )(input, cursor);
}

export function sequence<T>(ps: Parser<T>[]): Parser<T[]> {
  return traverse((p) => p, ps);
}
