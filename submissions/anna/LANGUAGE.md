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
+, -, *, /, >, <, >=, <=, =, /=, |, &, %, neg
```

lists:

```
push, pop, length, @
```

streams:

```
take, while
```

### looping

- use `iterate` to create a stream

example:

```
replace step(x) with { x.*(x.+(1)) }
replace factorial(n) with {
  1.iterate(step).take(n.-(1))
}

replace nextfib(list) with {
  replace last with list.@(list.length().-(1))
  replace penult with list.@(list.length().-(2))
  list.push(last.+(penult))
}
replace fib(n) with {
  [1, 1].iterate(nextfib).take(n)
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
UN_OPS := '-' | 'length'
BIN_OPS := '=' | '/=' | '>' | '<' | '|' | '&' | '+' | '*' | '-' | '/' | '%' | '@' | 'push' | 'pop' | 'iterate' | 'take' | 'while'
TERN_OPS := '?'
CALL := '.' [ UN_OPS '()' | BIN_OPS '(' EXPR ')' | TERN_OPS '(' EXPR ',' EXPR ')' |  IDENT '(' EXPRS ')' ]
EXPRS := EXPR { ',' EXPR } | ""
VALUE := '[' EXPRS '] | NUMBER | IDENT;
EXPR := VALUE { CALL }
MAIN := 'main' SCOPE
PROGRAM := { ASSIGN_FUNC } MAIN
```
