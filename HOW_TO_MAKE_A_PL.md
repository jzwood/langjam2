# HOW TO WRITE A PL (ABRIDGED)

```
SOURCE CODE -> AST -> ANALYSIS -> { EVALUATED
   \__PARSING__/     (OPTIONAL)   { VM BYTE CODE
                                  { MACHINE CODE
                                  { TRANSPILED SOURCE CODE
```

There are textbooks dedicated to each step in this pipeline, but each idea is
digestible in a single sitting, IMHO.

### LANGUAGE CONCEPT

Figure out what your language does -- it can be any kind of computation you
want!

We're going to flesh out an absurd little language with unary operators 'P' and
'M' and value value type, 'A'.

### PARSING

- identify a grammar

```
OPERATOR := 'P' | 'M'
VALUE := 'A'
EXPRESSION := { VALUE | EXPRESSION OPERATOR }
```

A program might look like `AAAPAMAPP`.

- identify the data structure for the abstract syntax tree (AST).

```
EXPR :: ENUM(VALUE, TUPLE(OPERATOR, VALUE))
PROGRAM :: LIST[EXPR]
```

Our ast might look like `[A, A, {P, A}, {M, A}, {P, {P, A}}]`.

- implementation in psuedo code

```
function tokenize(src) :: tokens {
    return string_to_charlist(src)
}

function parse(tokens, ast) :: ast {
    if (tokens.length === 0) return ast.reverse()
    if (tokens.head == 'A') return parse(tokens.tail, prepend(tokens.head, ast))
    return parse(tokens.tail, prepend({tokens.head, ast.head}, ast.tail))
}
```

### EVALUATION

Here's where we interpret our AST -- that is to say, assign "meaning". I'm
deciding that 'A' means 1 Apple, 'P' means add 1 apple, and 'M' means remove 1
apple.

taking our sample ast above, the output should be `AAAAAAA`. fascinating, I
know.

- implementation in psuedo code

```
function evaluate(ast) :: result {
    if (ast.head == {'P', expr}) return prepend('A', evaluate(expr)).concat(evaluate(ast.tail))
    if (ast.head == {'M', expr}) return evaluate(expr).tail.concat(ast.tail)
    return prepend('A', evaluate(tail(ast)))
}
```

### ANALYSIS

The above examples didn't provide any analysis but it's easy to come up with
inputs that violate the grammar.

For example the programs `M` and `PP` cannot be represented in the grammar.
Detecting these failure modes before evaluation is one aspect of analysis. While
grammar errors can be caught during parsing, semantic and type errors can be
caught by analysing the AST.

Performance optimization are another facet of analysis. For instance, if you
encountered the consecutive tokens `[P, M]` you could optimize them away to `[]`
b/c `M` undoes `P`.


### NOTES

The shrewd programmer will have realized that the grammar for this PL is so
simple that evaluation can be performed directly on the tokens. If you can get
away with it, there's nothing wrong with this.

- simplified evaluation pseudo code

```
function evaluate(src) {
    return string_to_charlist(src).fold(function (accumulator, token) {
        if (token.head == 'A' or 'P') return prepend('A', accumulator)
        if (token.head == 'M') return return accumulator.tail
    }, [])
}
```

For more simple (slightly more realistic) examples, look in the _/examples/_ directory.
