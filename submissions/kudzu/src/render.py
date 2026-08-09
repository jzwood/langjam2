"""more to it than we might think."""
from .rewrite import match
from .term import App, show

RESET = "\x1b[0m"
BOLD = "\x1b[1m"
DIM = "\x1b[2m"


def leaves(t, acc):
    if isinstance(t, App) and t.head == ":" and len(t.args) == 2:
        leaves(t.args[0], acc)
        leaves(t.args[1], acc)
    else:
        acc.append(t)
    return acc


def lens(t, view):
    if view == "flat": return " ".join(show(x, 2) for x in leaves(t, []))
    return show(t)


def aim(t, pattern):
    if pattern is None: return t
    if match(pattern, t, {}) is not None: return t
    if isinstance(t, App):
        for a in t.args:
            hit = aim(a, pattern)
            if hit is not None: return hit


def clip(text, width):
    """Keep both ends: the seed you started from and the edge that is still
    growing. The middle is the part you already understand."""
    if width < 12 or len(text) <= width: return text
    keep = width - 3
    head = keep // 3
    return text[:head] + "..." + text[len(text) - (keep - head):]


def paint(text, previous, color):
    """Highlight the part that is new since the last frame."""
    if not color or previous is None: return text
    i = 0
    while i < len(text) and i < len(previous) and text[i] == previous[i]: i += 1
    if i == len(text): return text
    return DIM + text[:i] + RESET + BOLD + text[i:] + RESET


class Camera(object):
    def __init__(self, view="tree", watch=None, width=80, color=False):
        self.view = view
        self.watch = watch
        self.width = width
        self.color = color
        self.previous = None

    def body(self, machine):
        subject = aim(machine.term, self.watch)
        seen = "(nothing in view)" if subject is None else lens(subject, self.view)
        raw = clip(seen, self.width - 6)
        painted = paint(raw, self.previous, self.color)
        self.previous = raw
        return painted

    def frame(self, machine):
        return "%4d  %s" % (machine.frame, self.body(machine))

    def rulebook(self, machine, limit=8):
        lines = []
        for rule in machine.rules[:limit]:
            mark = "+" if rule.origin == "learned" else " "
            lines.append("  %s %s" % (mark, clip(str(rule), self.width - 6)))
        hidden = len(machine.rules) - len(lines)
        if hidden > 0: lines.append("    ... %d more" % hidden)
        return lines
