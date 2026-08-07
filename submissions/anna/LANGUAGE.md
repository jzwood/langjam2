## ANNA

### function definitions

```
replace foobar(a, b, c) with {
...
}
```

### calling conventions

`.` is the infix operator. with only 1 argument `.` becomes a postfix operator
-- there is no prefix operator.

### variable definition

```
replace value with <expression>
```

### types

- floats: `0.33`
- lists: `[_, _, ...]`
- streams

### built-in operators

floats:

```
+, -, *, /, >, >=, =, /=
```

lists:

```
push, pop, at, =
```

streams:

```
drop, take, while
```

### looping

- use `iterate` to create a stream

```
iterate <value> with <function_name | function_definition>
```

example:

```
replace incr(x) with { x.+(1) }
replace factorial(n) with {
  1.iterate(incr).take(n).fold(*, 1)
}

replace nextfib(list) with {
  replace fst with list.@(0)
  replace snd with list.@(1)
  [snd, fst.+(snd)]
}
replace fibalg(acc, pair) with {
  acc.push(pair.a(2))
}
replace fib(n) with {
  [1, 1].iterate(nextfib).fold(fibalg, [])
}
```

### typechecking

lol no.

### main

```
main {
...
}
```

### grammar

```
IDENT := a-z { a-z }
SCOPE := '{' { ASSIGN_VAR } EXPR '}'
ASSIGN_VAR := 'replace' IDENT 'with' EXPR
PARAMS := IDENT { ',' IDENT } | ""
ASSIGN_FUNC := 'replace' IDENT '(' PARAMS ')' SCOPE
BIN_OPS := '=' | '>' | '<' | '|' | '&' | '+' | '*' | '-' | '/' | '%' | 'push' | 'pop' | 'iterate' | '@'
TERN_OPS := '?' | 'fold'
CALL := EXPR '.' [ BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
EXPRS := EXPR { ',' EXPR } | ""
VALUE := '[' EXPRS '] | NUMBER | IDENT;
EXPR := CALL | VALUE
MAIN := 'main' SCOPE
PROGRAM := { ASSIGN_FUNC } MAIN
```
