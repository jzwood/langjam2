"""a simple parser with many opinions to compress it."""

import re

from .term import INFIX, TRUE, App, Int, KudzuError, Rule, Var, variables

TOKEN = re.compile(r"""
      (?P<ws>\s+)
    | (?P<int>\d+)
    | (?P<var>[A-Z_][A-Za-z0-9_]*)
    | (?P<id>[a-z][A-Za-z0-9_]*)
    | (?P<op>=>|==|!=|<=|>=|[-+*/%:<>(),])
""", re.X)

PREFIX_WORDS = ("not",)
KEYWORDS = ("when", "seed", "strategy", "view", "watch")


class Program(object):
    def __init__(self, rules, seed, strategy, view="tree", watch=None):
        self.rules = rules
        self.seed = seed
        self.strategy = strategy
        self.view = view
        self.watch = watch


def lex(line, lineno):
    toks, i = [], 0
    while i < len(line):
        m = TOKEN.match(line, i)
        if m is None: raise KudzuError("line %d: cannot read %r" % (lineno, line[i]))
        i = m.end()
        kind = m.lastgroup
        if kind != "ws":
            toks.append((kind, m.group()))
    return toks


class Parser(object):
    def __init__(self, toks, lineno):
        self.toks = toks
        self.pos = 0
        self.lineno = lineno

    def peek(self):
        return self.toks[self.pos] if self.pos < len(self.toks) else (None, None)

    def at(self, text):
        return self.peek()[1] == text

    def next(self):
        kind, text = self.peek()
        if kind is None: self.fail("unexpected end of line")
        self.pos += 1
        return kind, text

    def expect(self, text):
        kind, got = self.next()
        if got != text: self.fail("expected %r, found %r" % (text, got))
        return got

    def done(self):
        return self.pos >= len(self.toks)

    def end(self, what):
        if not self.done(): self.fail("trailing input after %s" % what)

    def fail(self, msg):
        raise KudzuError("line %d: %s" % (self.lineno, msg))

    def expr(self, min_prec=0):
        left = self.unary()
        while True:
            _, text = self.peek()
            if text not in INFIX: return left
            prec, assoc = INFIX[text]
            if prec < min_prec: return left
            self.next()
            right = self.expr(prec if assoc == "right" else prec + 1)
            left = App(text, [left, right])

    def unary(self):
        kind, text = self.peek()
        if text in PREFIX_WORDS:
            self.next()
            return App(text, [self.expr(4)])
        if text == "-":
            self.next()
            # i apologize
            if self.peek()[0] == "int": return Int(-int(self.next()[1]))
            return App("-", [Int(0), self.unary()])
        return self.atom()

    def atom(self):
        kind, text = self.next()
        if kind == "int": return Int(int(text))
        if kind == "var": return Var(text)
        if kind == "id":
            if text in KEYWORDS: self.fail("%r is a keyword" % text)
            if text == "learn": return self.learn()
            if not self.at("("): return App(text)
            self.next()
            args = []
            if not self.at(")"):
                args.append(self.expr())
                while self.at(","):
                    self.next()
                    args.append(self.expr())
            self.expect(")")
            return App(text, args)
        if text == "(":
            inner = self.expr()
            self.expect(")")
            return inner
        self.fail("unexpected %r" % text)

    def learn(self):
        self.expect("(")
        lhs = self.expr()
        guard = TRUE
        if self.at("when"):
            self.next()
            guard = self.expr()
        self.expect("=>")
        rhs = self.expr()
        self.expect(",")
        rest = self.expr()
        self.expect(")")
        if isinstance(lhs, Int): self.fail("a learned rule cannot rewrite a literal")
        if isinstance(lhs, Var) and guard == TRUE:
            self.fail("a learned bare variable rewrites everything. add a guard")
        return App("learn", [App("=>", [lhs, guard, rhs]), rest])


def parse_rule(p):
    lhs = p.expr()
    guard = None
    if p.at("when"):
        p.next()
        guard = p.expr()
    p.expect("=>")
    rhs = p.expr()
    p.end("rule")
    check_rule(lhs, guard, rhs, p)
    return Rule(lhs, guard, rhs, "source", p.lineno)


def holes(t):
    if isinstance(t, Var): return t.name == "_"
    if not isinstance(t, App): return False
    if t.head == "=>" and len(t.args) == 3: return holes(t.args[1]) or holes(t.args[2])
    return any(holes(a) for a in t.args)


def free_vars(t):
    if isinstance(t, App) and t.head == "=>" and len(t.args) == 3:
        lhs, guard, rhs = t.args
        own = variables(lhs)
        return (free_vars(guard) | free_vars(rhs)) - own
    if isinstance(t, App):
        out = set()
        for a in t.args: out |= free_vars(a)
        return out
    return variables(t)


def check_rule(lhs, guard, rhs, p):
    if isinstance(lhs, Int): p.fail("a rule cannot rewrite a literal")
    if isinstance(lhs, Var) and guard is None:
        p.fail("a bare variable on the left rewrites everything. add a guard")
    bound = variables(lhs)
    for name in sorted(free_vars(rhs) | free_vars(guard or TRUE)):
        if name not in bound: p.fail("%s is not bound by the left-hand side" % name)
    if holes(rhs) or holes(guard or TRUE):
        p.fail("_ binds nothing, so it cannot be used on the right")


def parse(src):
    rules, seed = [], None
    strategy, view, watch = "outermost", "tree", None
    for lineno, raw in enumerate(src.splitlines(), 1):
        line = raw.split("#", 1)[0].strip()
        if not line: continue
        p = Parser(lex(line, lineno), lineno)
        if p.at("strategy"):
            p.next()
            _, strategy = p.next()
            if strategy not in ("outermost", "parallel"): p.fail("unknown strategy %r" % strategy)
            p.end("strategy")
        elif p.at("view"):
            p.next()
            _, view = p.next()
            if view not in ("tree", "flat"): p.fail("unknown view %r" % view)
            p.end("view")
        elif p.at("watch"):
            p.next()
            watch = p.expr()
            p.end("watch")
        elif p.at("seed"):
            p.next()
            seed = p.expr()
            p.end("seed")
        else:
            if p.at("learn"): p.fail("learn is a reserved word and cannot be the head of a rule")
            rules.append(parse_rule(p))
    if seed is None: raise KudzuError("no seed: nothing to grow")
    return Program(rules, seed, strategy, view, watch)
