#!/usr/bin/env python3
"""Local dev server for the prototype.

Same as `python3 -m http.server`, plus `Cache-Control: no-store` on every
response so the browser always picks up edited CSS/JS without a hard reload.

Usage:  python3 serve.py            -> http://localhost:4173
        python3 serve.py 8000       -> custom port
        PORT=8000 python3 serve.py  -> custom port from the environment
"""
import os
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter log: only errors
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 4173))
    handler = partial(NoCacheHandler, directory="prototype")
    print(f"Serving prototype/ at http://localhost:{port}  (Ctrl+C to stop)")
    ThreadingHTTPServer(("", port), handler).serve_forever()
