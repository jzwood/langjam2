"""thing go brrrr"""
from .term import (FALSE, TRUE, App, Int, KudzuError, Rule, Var, exceeds,
                   show, variables)

ARITH = {
    "+": lambda a, b: a + b,
    "-": lambda a, b: a - b,
    "*": lambda a, b: a * b,
    "/": lambda a, b: a // b,
    "%": lambda a, b: a % b,
}

ORDER = {
    "<": lambda a, b: a < b,
    ">": lambda a, b: a > b,
    "<=": lambda a, b: a <= b,
    ">=": lambda a, b: a >= b,
}

BUILTIN = set(ARITH) | set(ORDER) | set(["==", "!=", "and", "or", "not"])


def match(pat, t, b):
    if isinstance(pat, Var):
        if pat.name == "_": return b
        if pat.name in b:
            return b if b[pat.name] == t else None
        b = dict(b)
        b[pat.name] = t
        return b
    if isinstance(pat, Int):
        return b if isinstance(t, Int) and t.value == pat.value else None
    if not isinstance(t, App) or t.head != pat.head or len(t.args) != len(pat.args):
        return None
    for p, a in zip(pat.args, t.args):
        b = match(p, a, b)
        if b is None: return None
    return b


def subst(t, b):
    if isinstance(t, Var): return b.get(t.name, t)
    if isinstance(t, App) and t.head == "=>" and len(t.args) == 3:
        lhs, guard, rhs = t.args
        own = variables(lhs)
        inner = {k: v for k, v in b.items() if k not in own}
        return App(t.head, [lhs, subst(guard, inner), subst(rhs, inner)])
    if isinstance(t, App) and t.args: return App(t.head, [subst(a, b) for a in t.args])
    return t


def is_value(t):
    if isinstance(t, Int): return True
    if isinstance(t, Var): return False
    if t.head in BUILTIN: return False
    return all(is_value(a) for a in t.args)


def builtin(t):
    args = t.args
    if len(args) == 2 and isinstance(args[0], Int) and isinstance(args[1], Int):
        x, y = args[0].value, args[1].value
        if t.head in ARITH:
            if t.head in ("/", "%") and y == 0:
                raise KudzuError("division by zero in %s" % show(t))
            return Int(ARITH[t.head](x, y))
        if t.head in ORDER:
            return TRUE if ORDER[t.head](x, y) else FALSE
    if t.head in ("==", "!=") and len(args) == 2:
        if is_value(args[0]) and is_value(args[1]):
            same = args[0] == args[1]
            return TRUE if same == (t.head == "==") else FALSE
    if t.head in ("and", "or") and len(args) == 2:
        if args[0] in (TRUE, FALSE) and args[1] in (TRUE, FALSE):
            a, c = args[0] == TRUE, args[1] == TRUE
            return TRUE if (a and c if t.head == "and" else a or c) else FALSE
    if t.head == "not" and len(args) == 1 and args[0] in (TRUE, FALSE):
        return FALSE if args[0] == TRUE else TRUE
    return None


def rebuild(head, args):
    t = App(head, args)
    if t.head not in BUILTIN: return t
    done = builtin(t)
    return t if done is None else done


def fold(t):
    if not isinstance(t, App) or not t.args: return t
    return rebuild(t.head, [fold(a) for a in t.args])


def fire(rule, t):
    b = match(rule.lhs, t, {})
    if b is None: return None
    if rule.guard is not None:
        decided = fold(subst(rule.guard, b))
        if decided == FALSE: return None
        if decided != TRUE:
            raise KudzuError(
                "guard did not decide: %s in rule `%s`" % (show(decided), rule))
    return fold(subst(rule.rhs, b))


class Machine(object):
    def __init__(self, program):
        self.rules = list(program.rules)
        self.strategy = program.strategy
        self.term = fold(program.seed)
        self.frame = 0
        self.learned = 0
        self.known = set()
        self.by_head = {}
        self.overgrown = False

    def install(self, literal):
        lhs, guard, rhs = literal.args
        guard = None if guard == TRUE else guard
        key = (lhs, guard, rhs)
        if key in self.known:
            self.rules = [r for r in self.rules if r.origin != "learned"
                          or (r.lhs, r.guard, r.rhs) != key]
        else:
            self.known.add(key)
            self.learned += 1
        self.rules.insert(0, Rule(lhs, guard, rhs, "learned"))
        self.by_head = {}

    def applicable(self, t):
        key = t.head if isinstance(t, App) else None
        hit = self.by_head.get(key)
        if hit is None:
            hit = [r for r in self.rules
                   if not isinstance(r.lhs, App) or r.lhs.head == key]
            self.by_head[key] = hit
        return hit

    def redex(self, t):
        if isinstance(t, App) and t.head == "learn" and len(t.args) == 2:
            self.install(t.args[0])
            return t.args[1]
        for rule in self.applicable(t):
            out = fire(rule, t)
            if out is not None: return out
        return None

    def outermost(self, t):
        out = self.redex(t)
        if out is not None: return out
        if isinstance(t, App):
            for i, a in enumerate(t.args):
                out = self.outermost(a)
                if out is not None:
                    args = list(t.args)
                    args[i] = out
                    return rebuild(t.head, args)
        return None

    def parallel(self, t):
        out = self.redex(t)
        if out is not None: return out, True
        if isinstance(t, App) and t.args:
            grown, args = False, []
            for a in t.args:
                a, changed = self.parallel(a)
                grown = grown or changed
                args.append(a)
            if grown: return rebuild(t.head, args), True
        return t, False

    def step(self):
        if self.strategy == "parallel":
            t, grown = self.parallel(self.term)
            if not grown: return False
        else:
            t = self.outermost(self.term)
            if t is None: return False
        self.term = t
        self.frame += 1
        return True


BUDGET = 200000


def run(program, frames, budget=BUDGET):
    m = Machine(program)
    yield m
    for _ in range(frames):
        if not m.step(): return
        m.overgrown = exceeds(m.term, budget)
        yield m
        if m.overgrown: return
