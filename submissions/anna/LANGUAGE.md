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
replace rangenext(list) with {
  replace next with list.last().+(1)
  list.push(next)
}

replace range(a, n) with {
  [a].iterate(rangenext).take(n)
}

replace last(list) with {
  list.@(list.length().-(1))
}

replace nextfib(list) with {
  replace penult with list.@(list.length().-(2))
  list.push(penult.+(list.last()))
}
replace fib(n) with {
  [1, 1].iterate(nextfib).take(n)
}

main {
  1.range(4)
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
