export type Result<E, T> =
  | { ok: false; error: E }
  | { ok: true; value: T };

export function err<E, T>(error: E): Result<E, T> {
  return { ok: false, error };
}

export function ok<E, T>(value: T): Result<E, T> {
  return { ok: true, value };
}

export function map<E, A, B>(
  result: Result<E, A>,
  fn: (a: A) => B,
): Result<E, B> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function bind<E, A, B>(
  result: Result<E, A>,
  fn: (a: A) => Result<E, B>,
): Result<E, B> {
  return result.ok ? fn(result.value) : result;
}
