# the kudzu language

A program is a rulebook and a seed. Running it means rewriting the seed over and
over. There is no main, no return, and no output statement.

## terms

Everything is a term, and there are three kinds.

| | |
|---|---|
| integers | `0`, `42`, `-7` |
| variables | `N`, `Xs`, `_` (start with an uppercase letter or an underscore) |
| applications | `nats(0)`, `dead`, `a : b` (heads start with a lowercase letter) |

An atom is just an application with no arguments, so `dead` and `dead()` are the
same term. `_` matches anything and binds nothing.

Comments run from `#` to the end of the line. One statement per line, and lines
do not continue.

## statements

```
nats(N) => N : nats(N + 1)      # a rule
test(K) when K > 2 => big       # a rule with a guard
seed nats(0)                    # what to grow (required, one per program)
strategy parallel               # outermost (default) or parallel
view flat                       # tree (default) or flat
watch nats(_)                   # aim the camera at a subterm
```

## rules

`lhs => rhs`, optionally `lhs when guard => rhs`. The left side is a pattern.
Matching is syntactic and first order: a repeated variable has to match equal
terms, so `pair(X, X)` matches `pair(2, 2)` and not `pair(2, 3)`.

Rules are tried in the order they appear. Two rules are rejected before the
program runs: a literal on the left, because nothing can rewrite `1`, and a bare
variable on the left without a guard, because it would rewrite everything
including itself. Every variable on the right has to be bound on the left.

Guards must decide immediately. A guard that evaluates to something other than
`true` or `false` is an error rather than a failed match, so a typo in a guard
does not quietly turn into a rule that never fires.

## operators

Sugar for ordinary applications: `a : b` is the same term as `:(a, b)`.

| precedence | operators | associativity |
|---|---|---|
| 1 | `:` | right |
| 2 | `or` | left |
| 3 | `and` | left |
| 4 | `==` `!=` `<` `>` `<=` `>=` | left |
| 5 | `+` `-` | left |
| 6 | `*` `/` `%` | left |

`:` is the loosest, which is why `f => g + 1 == 3 : f` needs no parentheses.
Division is integer division and rounds towards negative infinity, so `-7 / 2`
is `-4` and `-7 % 2` is `1`. Dividing by zero is an error.

`learn` is reserved and cannot be used as the head of a rule.

## strict builtins, lazy rules

Arithmetic and comparison are builtins, and they are strict: they compute as
soon as their operands are values and stay put otherwise. `g + 1 == 3` where `g`
is still a redex does not fold to `false`, it waits.

User rules are the opposite. Nothing forces a subterm, which is what lets a rule
hand you an unfinished term and let you keep going.

`==` and `!=` compare any two values structurally. The ordering operators want
integers.

## how a frame happens

**outermost** (the default) rewrites the leftmost outermost redex, one per
frame. This is what makes corecursive definitions productive: innermost
rewriting would descend into `nats(N + 1)` looking for a value and never come
back out.

**parallel** rewrites every outermost redex at once and does not descend into
what it just produced. That is what an L-system means by a generation, so
`strategy parallel` gets you `algae.kudzu` in two rules.

## learn

```
learn(<rule>, <term>)
```

Installs a rule, then carries on as `<term>`. The rule is a literal, so it keeps
its own variables. Anything bound by the enclosing rule is substituted into it
on the way in, which is how a learned rule remembers where it came from:

```
test(K) => learn(test(J) when J % K == 0 => dead, K)
```

`K` comes from outside and gets baked in. `J` belongs to the new rule and stays
a variable.

Learned rules go to the front of the book, so the most recent thing a program
learned is the first thing it tries. Rules cannot be removed.

## the camera

A term outgrows the terminal in seconds, so kudzu does not print, it looks.

`view tree` shows the term. `view flat` reads the leaves of a `:` tree left to
right, which is what you want when the term stands for a sequence: rewriting one
symbol into two nests the spine, and the flat view reads the row of symbols back
off it without lying about the shape underneath.

`watch <pattern>` aims at the leftmost outermost subterm that matches, so
`watch hail(_)` follows the growing edge and lets the history scroll away.

Whatever is left over is clipped from the middle, keeping the seed you started
from and the edge that is still moving.

There is a budget as well, because a frame count is no protection: a parallel
program can double its term every frame, so `algae` is astronomically large long
before the two hundredth generation. A run stops once the term passes
`--max-nodes` (200000 by default, and less in the browser, where drawing the
term costs more than growing it). Hitting the budget is not a failure; it means
you ran out of room to watch:

```
$ python3 kudzu.py examples/algae.kudzu -n 200
stopped at frame 24: the term passed 200000 nodes.
```

## the checker

kudzu programs are meant to run forever, so the checker warns about programs
that might not. It is an approximation over the call graph of rule heads, it
runs before the program does, and it only ever warns.

- **this program halts: no cycle is reachable from the seed.**
- **nothing on the cycle X grows: this program will not produce anything.**
  There is a cycle, but no rule on it makes the term bigger. Growth is measured
  after constant folding, so `count(N) => count(N + 1)` is correctly seen as not
  growing.
- **line N: `rule` never fires, line M already covers it.** An earlier unguarded
  rule matches everything the later one would.

## what is not here

No strings, no floats, no input, no way to define your own operators, and no way
for a program to forget a rule. Guards cannot ask whether something is an
integer.

Every frame walks from the root to find the outermost redex, so as the term
grows the walk does too. Rules are indexed by head, which keeps a program that
has learned hundreds of rules from trying all of them at every node, but the
walk itself is still linear in the term. In practice a few hundred frames are
instant, three thousand frames of the sieve take about a second, and five
thousand frames of `nats` take about half a minute, most of it spent rendering
and rewalking a term that is five thousand nodes deep.
