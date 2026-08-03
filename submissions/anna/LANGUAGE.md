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
  replace i with n
  replace result with {
      iterate <n, i> with {
      <num * index, index.-(1)>
    } until {
      i.=(0)
    }
  }
  result.0()
}
```

### main

```
main {
...
}
```

### grammar

```
ALPHA := a-z
SPACE := ' '
ASSIGN_VAR := 'replace' SPACE ALPHA SPACE 'with' EXPR
ARGS := ALPHA { ',' ALPHA } | ""
ASSIGN_FUNC := 'replace' SPACE ALPHA '(' ARGS ')' EXPR
BIN_OPS := '=' | '+' | '*' | '-' | '/' | 'push' | 'pop' | 'at'
TERN_OPS := '?'
CALL := EXPR '.' [ '()' | BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  ALPHA '(' EXPRS ')' ]
EXPRS := EXPR { ',' EXPR } | ""
LIST := '[' EXPRS ']'
EXPR := NUMBER | LIST | CALL | { ASSIGN_VAR } EXPR
MAIN := 'main' SPACE EXPR
PROGRAM := MAIN WHITESPACE { ASSIGN_FUNC }
```
