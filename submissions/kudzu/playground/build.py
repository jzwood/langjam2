#!/usr/bin/env python3
"""Generate playground/index.html from the real interpreter.

The page inlines src/*.py rather than fetching it, so the playground works when
somebody double-clicks the file as well as when it is served. That means the
generated page has to be rebuilt whenever the language changes:

    python3 playground/build.py
"""

import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

MODULES = ["__init__.py", "term.py", "parse.py", "rewrite.py", "render.py",
           "check.py"]


def read(*parts):
    with open(os.path.join(*parts)) as f:
        return f.read()


def embed(value):
    """JSON that is safe to drop inside a <script> tag."""
    return json.dumps(value, indent=1).replace("</", "<\\/")


def build():
    sources = dict(("src/" + name, read(ROOT, "src", name))
                   for name in MODULES)
    examples = dict((name, read(ROOT, "examples", name))
                    for name in sorted(os.listdir(os.path.join(ROOT, "examples")))
                    if name.endswith(".kudzu"))
    page = read(HERE, "template.html")
    page = page.replace("/*SOURCES*/", embed(sources))
    page = page.replace("/*EXAMPLES*/", embed(examples))
    return page


if __name__ == "__main__":
    out = os.path.join(HERE, "index.html")
    with open(out, "w") as f:
        f.write(build())
    print("wrote %s (%.1f kb)" % (out, len(build()) / 1024.0))
