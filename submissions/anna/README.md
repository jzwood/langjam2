# LANGUAGE NAME HERE

## AUTHORS

- Jake ([jzwood](https://github.com/jzwood))

## ABOUT

The quirkiest thing about ANNA is that the `.` operator is used to invoke all
functions, and it's an infix operator!

examples:

- arithmetic looks like `4.+(5.*(2))`

say there's a function: `avg(a, b) { }` -- you would invoke it like `5.avg(10)`.
or `negate(value) { }`: `6.negate()`. there are no 0-arity functions.

### THEME

There are no looping constructs and direct recursion will fail to evaluate.

Intead you have
- 1 corecursion operator, `iterate`, which produces a stream by iteratively applying a step function.
- 1 structural recursion operator, `fold`, which acts on lists and streams.

## HOW TO USE

The ANNA interpreter is a deno CLI tested with Deno 2.9.3 (x86_64 apple-darwin).

Checkout the anna playground here: https://jzwood.science/anna/playground/

## AI USAGE

Used AI to occasionally demystify typescript errors.
