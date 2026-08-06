# KUDZU

## AUTHORS

- veit heller ([hellerve](https://github.com/hellerve))

## ABOUT

kudzu is a term rewriting language where evaluation is growth rather than
reduction. you write rules and a seed, and every frame the program rewrites
itself into something bigger.

nothing is ever the answer.

through a window, you watch a term that keeps getting longer. the run only
stops when you tell it to.

the natural numbers

```
nats(N) => N : nats(N + 1)

seed nats(0)
```

and the steps

```
   0  nats(0)
   1  0 : nats(1)
   2  0 : 1 : nats(2)
   3  0 : 1 : 2 : nats(3)
   4  0 : 1 : 2 : 3 : nats(4)
```

the magic trick is that a program can extend its rulebook. `learn` installs a
new rule, and the source you wrote is not the source you run even just a few
steps later. look at the sample program below.

a full language reference is in [LANGUAGE.md](LANGUAGE.md).

(warning: the implementation is lightly golfed, for no good reason other than i
love breaking the rules of taste. an ungolfed version would be well within the
limits.)

### THEME

kudzu is meant to grow forever, recursively, and halting is a bug. eventually,
kudzu will cover the world if you let it (come on, let it).

```
$ python3 kudzu.py examples/mistake.kudzu
kudzu: nothing on the cycle count grows: this program will not produce anything.
```

## HOW TO USE

kudzu needs Python 3.11+ and nothing else. 3.11+ because of the stack size,
kudzu is too wild to be contained by older python.

```
cd submissions/kudzu
python3 kudzu.py examples/sieve.kudzu -n 40
```

useful flags:
- `-n` how many frames to watch, or `--max-nodes` to stop when the term grows to
  a certain size.
- `--view flat` read a sequence off the leaves, or `--view tree` (the default)
  to let it branch.

### PLAYGROUND

i put the slop [here](https://cyberwitchery.com/kudzu/).

*(this section, as was the playground, is llm-generated)*

`playground/index.html` runs the interpreter in the browser and animates the
frames, which suits a language you are supposed to watch better than a terminal
does. Open the file directly or serve the directory, then press grow. It needs a
network connection the first time, because it loads CPython from the Pyodide
CDN, and nothing else.

It stops on its own once the term outgrows the window rather than once it has
counted enough frames, which is the only workable leash on a parallel program:
`algae` doubles its term every generation and hits the limit in about twenty of
them.

The page inlines the real `src/*.py`, so it cannot drift into being a separate
implementation. `python3 playground/build.py` regenerates it.

*(end llm prose)*

### SAMPLE PROGRAM

behold the sieve of Eratosthenes:

```
nats(N)   => test(N) : nats(N + 1)
test(K)   => learn(test(J) when J % K == 0 => dead, K)
dead : Xs => Xs

seed nats(2)
```

where we are going, we do not need division, counting, or filtering. let me
explain.

the first rule grows an endless stream of candidates. every number is born
into the warm embrace of `test`, because we still have to judge its worth.

the second rule examines the infant number against the others it has seen.
it only ever runs when no other rule matched. an infant is compared to
every number-became-rule first. if one of them recognises itself but bigger,
the candidate dies.

if none of them do, it is prime and worthy, and it will teach the program its
rule: it will guard against its own multiples.

the third rule sweeps up the dead. we don’t need this clutter around.

if we run it, we get:

```
   0  nats(2)
   1  test(2) : nats(3)
   2  learn(test(J) when J % 2 == 0 => dead, 2) : nats(3)
   3  2 : nats(3)
   4  2 : test(3) : nats(4)
   5  2 : learn(test(J) when J % 3 == 0 => dead, 3) : nats(4)
   6  2 : 3 : nats(4)
   7  2 : 3 : test(4) : nats(5)
   8  2 : 3 : dead : nats(5)
   9  2 : 3 : nats(5)
  ...
  36  2 : 3 : 5 : 7 : 11 : 13 : nats(14)

rulebook
  + test(J) when J % 13 == 0 => dead
  + test(J) when J % 11 == 0 => dead
  + test(J) when J % 7 == 0 => dead
  + test(J) when J % 5 == 0 => dead
  + test(J) when J % 3 == 0 => dead
  + test(J) when J % 2 == 0 => dead
    nats(N) => test(N) : nats(N + 1)
    test(K) => learn(test(J) when J % K == 0 => dead, K)
    dead : Xs => Xs
```

the program and the set are growing at once, forever intertwined.

## AI USAGE

heavily used ai for the playground (entirely vibe-coded), and to discuss some of
the implementation ideas (claude code, opus 5). i also let it build some
of the examples and the language reference to make sure this is actually
understandable and usable by someone who isn’t as curt and weird as me.

no ai is needed at compile or run time, as the rules told me.

<hr/>

have fun!
