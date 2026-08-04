## ANNA

### function definitions

```
replace fib(a, b, c) with {
...
}
```

### calling conventions

`.` is the infix operator. with only 1 argument `.` becomes a postfix operator
-- there is no prefix operator.

### variable definition

```
replace value with {
...
}
```

### types

- floats: `0.33`
- bools: `T | F` -- stretch goal
- 2-tuple: `<_,_>` -- stretch goal
- lists: `[_, _, ...]`

### built-ins

floats:

```
+, -, *, /, >, >=, =, /=
```

bools:

```
and, or, not, =
```

tuples:

```
0, 1, =
```

lists:

```
push, pop, at, =
```

### looping

- no loops, no direct recursion, you only get iterate

```
iterate value with {
...
} until {
...
}
```

example:

```
replace fib(n) with {
  replace x with [n, n]
  iterate x with {
    replace num with seed.0()
    replace index with seed.1()
    [num * index, index.-(1)]
  } until {
    x.1().=(0)
  }
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
ASSIGN_VAR := 'replace' IDENT 'with' '{' EXPR '}'
ARGS := IDENT { ',' IDENT } | ""
ASSIGN_FUNC := 'replace' IDENT '(' ARGS ')' '{' EXPR '}'
ITERATE := 'iterate' VALUE 'with' '{' EXPR '}' 'until' '{' EXPR '}'
BIN_OPS := '=' | '+' | '*' | '-' | '/' | 'push' | 'pop' | 'at'
TERN_OPS := '?'
CALL := EXPR '.' [ '()' | BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
EXPRS := EXPR { ',' EXPR } | ""
LIST := '[' EXPRS ']'
VALUE := NUMBER | LIST | IDENT
EXPR := ASSIGN_VAR EXPR | ITERATE | VALUE | CALL
MAIN := 'main' '{' EXPR '}'
PROGRAM := { ASSIGN_FUNC } MAIN
```
