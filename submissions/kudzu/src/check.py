"""in which we answer the undecidable, approximately."""

from .rewrite import BUILTIN, match
from .term import App, Rule


def weight(t):
    if not isinstance(t, App):
        return 1
    if t.head in BUILTIN:
        return 1
    return 1 + sum(weight(a) for a in t.args)


def rule_head(rule):
    return rule.lhs.head if isinstance(rule.lhs, App) else None


def literals(t, acc):
    if isinstance(t, App):
        if t.head == "=>" and len(t.args) == 3:
            acc.append(t.args)
        for a in t.args:
            literals(a, acc)
    return acc


def occurring(t, acc):
    if isinstance(t, App):
        acc.add(t.head)
        for a in t.args:
            occurring(a, acc)
    return acc


def call_graph(program):
    every = list(program.rules)
    for rule in program.rules:
        for lhs, guard, rhs in literals(rule.rhs, []):
            every.append(Rule(lhs, guard, rhs, "learned"))

    defined = set(h for h in (rule_head(r) for r in every) if h)
    graph, growth = {}, {}
    for rule in every:
        head = rule_head(rule)
        if head is None: continue
        graph.setdefault(head, set())
        graph[head] |= (occurring(rule.rhs, set()) & defined)
        grows = weight(rule.rhs) - weight(rule.lhs)
        growth[head] = max(growth.get(head, grows), grows)
    return defined, graph, growth


def cycles_from(graph, start):
    on_cycle, path, seen = set(), [], set()

    def walk(node):
        if node in path:
            on_cycle.update(path[path.index(node):])
            return
        if node in seen: return
        seen.add(node)
        path.append(node)
        for nxt in sorted(graph.get(node, ())): walk(nxt)
        path.pop()

    for head in sorted(start): walk(head)
    return on_cycle


def shadowed(program):
    out = []
    for i, later in enumerate(program.rules):
        for earlier in program.rules[:i]:
            if earlier.guard is not None: continue
            if match(earlier.lhs, later.lhs, {}) is not None:
                out.append("line %d: `%s` never fires, line %d already "
                           "covers it." % (later.lineno, later, earlier.lineno))
                break
    return out


def check(program):
    warnings = []
    defined, graph, growth = call_graph(program)

    if any(rule_head(r) is None for r in program.rules): return warnings + shadowed(program)

    start = occurring(program.seed, set()) & defined
    looping = cycles_from(graph, start)

    if not looping: warnings.append("this program halts: no cycle is reachable from the seed.")
    elif all(growth.get(h, 0) <= 0 for h in looping):
        warnings.append(
            "nothing on the cycle %s grows: this program will not produce "
            "anything." % ", ".join(sorted(looping)))
    return warnings + shadowed(program)
