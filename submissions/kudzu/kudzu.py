#!/usr/bin/env python3
"""kudzu grows."""

import argparse
import os
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.check import check
from src.parse import parse
from src.render import Camera
from src.rewrite import BUDGET, run
from src.term import KudzuError


def term_width():
    return shutil.get_terminal_size((80, 24)).columns


def main(argv=None):
    ap = argparse.ArgumentParser(description="grow a kudzu program")
    ap.add_argument("file")
    ap.add_argument("-n", "--frames", type=int, default=12,
                    help="how far to watch (default 12)")
    ap.add_argument("--view", choices=("tree", "flat"), default=None,
                    help="override the program's own view")
    ap.add_argument("--max-nodes", type=int, default=BUDGET,
                    help="stop once the term is this big (default %d)" % BUDGET)
    args = ap.parse_args(argv)

    with open(args.file) as f:
        source = f.read()

    program = parse(source)
    for warning in check(program):
        print("kudzu: %s" % warning, file=sys.stderr)

    camera = Camera(view=args.view or program.view,
                    watch=program.watch,
                    width=term_width(),
                    color=sys.stdout.isatty())

    grown = None
    for m in run(program, args.frames, args.max_nodes):
        grown = m
        print(camera.frame(m))

    if grown is None:
        return 0
    print("\nrulebook")
    for line in camera.rulebook(grown, limit=32):
        print(line)
    if grown.overgrown:
        print("\nstopped at frame %d: the term passed %d nodes."
              % (grown.frame, args.max_nodes))
    elif grown.frame < args.frames:
        print("\nhalted after %d frames: no rule matched." % grown.frame)
    return 0


def boot():
    """set the ouchies"""
    sys.setrecursionlimit(200000)

    try:
        return main()
    except KudzuError as e:
        print("kudzu: %s" % e, file=sys.stderr)
    except IOError as e:
        print("kudzu: %s" % e, file=sys.stderr)

    return 1

if __name__ == "__main__":
    sys.exit(boot())
