#!/usr/bin/env python3
"""Helper for the decisions log.

The log is two files:
  docs/decisions.md       the index, one line per decision (read this one)
  docs/decisions-full.md  the full wording and the reasoning (look up, never read whole)

Usage, from the project root:
  python3 scripts/decisions.py next
      print the next free number
  python3 scripts/decisions.py show 53 [91 ...]
      print the index row and the full text of each decision
  python3 scripts/decisions.py add --summary "One line" [--decision "Full wording"]
                                   [--notes "Why"] [--status fixed] [--date YYYY-MM-DD]
      take the next number under a file lock, append to both files, print the number
  python3 scripts/decisions.py set-status 46 "superseded by 108"
      rewrite the status of a decision in the index
  python3 scripts/decisions.py check
      every number exactly once in each file, statuses point at numbers that exist

Several Claude sessions write to the log at once. `add` is the only safe way to get a
number: it locks the index, re-reads it and takes the largest number plus one.
"""
import argparse
import datetime
import fcntl
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "docs", "decisions.md")
FULL = os.path.join(ROOT, "docs", "decisions-full.md")

ROW = re.compile(r"^\| (\d+) \| (\d{4}-\d{2}-\d{2}) \| (.*) \| (.*) \|$")
SECTION = re.compile(r"^## (\d+) · (\d{4}-\d{2}-\d{2})$")


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def index_rows(text):
    return [m for m in (ROW.match(line) for line in text.splitlines()) if m]


def full_sections(text):
    """{number: section text}, a section runs from its heading to the next one."""
    sections, current, lines = {}, None, []
    for line in text.splitlines():
        m = SECTION.match(line)
        if m:
            if current is not None:
                sections.setdefault(current, []).append("\n".join(lines).rstrip())
            current, lines = int(m.group(1)), [line]
        elif current is not None:
            lines.append(line)
    if current is not None:
        sections.setdefault(current, []).append("\n".join(lines).rstrip())
    return sections


def next_number(text):
    return max((int(m.group(1)) for m in index_rows(text)), default=0) + 1


def cmd_next(_):
    print(next_number(read(INDEX)))


def cmd_show(args):
    rows = {int(m.group(1)): m for m in index_rows(read(INDEX))}
    sections = full_sections(read(FULL))
    for n in args.numbers:
        if n not in rows:
            print(f"{n}: no such decision", file=sys.stderr)
            continue
        m = rows[n]
        print(f"# {n} · {m.group(2)} · {m.group(4)}\n{m.group(3)}\n")
        for s in sections.get(n, ["(no full text)"]):
            print(s + "\n")


def clean(value):
    # a table cell cannot hold a newline or a bare pipe
    return " ".join(value.split()).replace("|", "\\|")


def cmd_add(args):
    date = args.date or datetime.date.today().isoformat()
    with open(INDEX, "r+", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        text = f.read()
        n = next_number(text)
        row = f"| {n} | {date} | {clean(args.summary)} | {clean(args.status)} |"
        lines = text.rstrip("\n").splitlines()
        last = max(i for i, line in enumerate(lines) if ROW.match(line))
        lines.insert(last + 1, row)
        f.seek(0)
        f.write("\n".join(lines) + "\n")
        f.truncate()
        section = f"\n## {n} · {date}\n\n{args.decision or args.summary}\n"
        if args.notes:
            section += f"\n**Why.** {args.notes}\n"
        with open(FULL, "a", encoding="utf-8") as full:
            full.write(section)
        fcntl.flock(f, fcntl.LOCK_UN)
    print(n)


def cmd_set_status(args):
    with open(INDEX, "r+", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        lines = f.read().splitlines()
        for i, line in enumerate(lines):
            m = ROW.match(line)
            if m and int(m.group(1)) == args.number:
                lines[i] = f"| {m.group(1)} | {m.group(2)} | {m.group(3)} | {clean(args.status)} |"
                break
        else:
            sys.exit(f"{args.number}: no such decision")
        f.seek(0)
        f.write("\n".join(lines) + "\n")
        f.truncate()
    print(lines[i])


def cmd_check(_):
    rows = index_rows(read(INDEX))
    numbers = [int(m.group(1)) for m in rows]
    sections = full_sections(read(FULL))
    problems = []
    seen = set()
    for n in numbers:
        if n in seen:
            problems.append(f"{n} appears twice in decisions.md")
        seen.add(n)
    for n, texts in sections.items():
        if len(texts) > 1:
            problems.append(f"{n} appears twice in decisions-full.md")
        if n not in seen:
            problems.append(f"{n} has full text but no index row")
    for n in seen - set(sections):
        problems.append(f"{n} has an index row but no full text")
    for m in rows:
        for ref in re.findall(r"\d+", m.group(4)):
            if int(ref) not in seen:
                problems.append(f"{m.group(1)}: status points at {ref}, which does not exist")
    for p in problems:
        print(p)
    print(f"{len(numbers)} decisions, next is {max(numbers) + 1}" if not problems
          else f"{len(problems)} problem(s)")
    sys.exit(1 if problems else 0)


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("next").set_defaults(func=cmd_next)
    s = sub.add_parser("show")
    s.add_argument("numbers", type=int, nargs="+")
    s.set_defaults(func=cmd_show)
    a = sub.add_parser("add")
    a.add_argument("--summary", required=True)
    a.add_argument("--decision")
    a.add_argument("--notes")
    a.add_argument("--status", default="fixed")
    a.add_argument("--date")
    a.set_defaults(func=cmd_add)
    st = sub.add_parser("set-status")
    st.add_argument("number", type=int)
    st.add_argument("status")
    st.set_defaults(func=cmd_set_status)
    sub.add_parser("check").set_defaults(func=cmd_check)
    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
