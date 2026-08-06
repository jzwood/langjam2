"""our vocabulary"""

class Var(object):
    __slots__ = ("name",)

    def __init__(self, name):
        self.name = name

    def __eq__(self, other):
        return isinstance(other, Var) and other.name == self.name

    def __hash__(self):
        return hash(("var", self.name))


class Int(object):
    __slots__ = ("value",)

    def __init__(self, value):
        self.value = value

    def __eq__(self, other):
        return isinstance(other, Int) and other.value == self.value

    def __hash__(self):
        return hash(("int", self.value))


class App(object):
    __slots__ = ("head", "args")

    def __init__(self, head, args=()):
        self.head = head
        self.args = tuple(args)

    def __eq__(self, other):
        return (isinstance(other, App) and other.head == self.head
                and other.args == self.args)

    def __hash__(self):
        return hash(("app", self.head, self.args))


INFIX = {
    ":": (1, "right"),
    "or": (2, "left"),
    "and": (3, "left"),
    "==": (4, "left"), "!=": (4, "left"),
    "<": (4, "left"), ">": (4, "left"), "<=": (4, "left"), ">=": (4, "left"),
    "+": (5, "left"), "-": (5, "left"),
    "*": (6, "left"), "/": (6, "left"), "%": (6, "left"),
}

TRUE = App("true")
FALSE = App("false")


class Rule(object):
    __slots__ = ("lhs", "guard", "rhs", "origin", "lineno")

    def __init__(self, lhs, guard, rhs, origin="source", lineno=0):
        self.lhs = lhs
        self.guard = guard
        self.rhs = rhs
        self.origin = origin
        self.lineno = lineno

    def __str__(self):
        head = show(self.lhs)
        if self.guard is not None: head += " when " + show(self.guard)
        return head + " => " + show(self.rhs)


class KudzuError(Exception):
    pass


def show(t, prec=0):
    if isinstance(t, Var): return t.name
    if isinstance(t, Int): return str(t.value)
    if t.head == "=>" and len(t.args) == 3:
        lhs, guard, rhs = t.args
        head = show(lhs)
        if guard != TRUE: head += " when " + show(guard)
        return head + " => " + show(rhs)
    if t.head == "not" and len(t.args) == 1:
        inner = "not " + show(t.args[0], 4)
        return "(" + inner + ")" if prec > 3 else inner
    if t.head in INFIX and len(t.args) == 2:
        p, assoc = INFIX[t.head]
        lp = p if assoc == "left" else p + 1
        rp = p if assoc == "right" else p + 1
        sep = " " + t.head + " " if t.head != ":" else " : "
        s = show(t.args[0], lp) + sep + show(t.args[1], rp)
        return "(" + s + ")" if prec > p else s
    if not t.args: return t.head
    return t.head + "(" + ", ".join(show(a, 0) for a in t.args) + ")"


def exceeds(t, budget):
    stack, seen = [t], 0
    while stack:
        node = stack.pop()
        seen += 1
        if seen > budget: return True
        if isinstance(node, App): stack.extend(node.args)
    return False


def variables(t, acc=None):
    acc = set() if acc is None else acc
    if isinstance(t, Var) and t.name != "_": acc.add(t.name)
    if isinstance(t, App):
        for a in t.args: variables(a, acc)
    return acc
