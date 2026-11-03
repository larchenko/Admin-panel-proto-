"""Download the evaluation photos listed in eval/sets.json into data/.

Open Images V5, CC BY 2.0 (authors in the Open Images metadata). The photos are
not committed; this script restores them.
"""
import concurrent.futures as cf
import json
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
SETS = json.loads((ROOT / "eval" / "sets.json").read_text())


def fetch(item):
    kind, (image_id, split) = item
    dest = ROOT / "data" / kind / f"{image_id}.jpg"
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    url = SETS["url"].format(split=split, id=image_id)
    with urllib.request.urlopen(url, timeout=60) as r:
        dest.write_bytes(r.read())


def main():
    items = [(k, v) for k in ("cars", "frontal", "rims") for v in SETS[k]]
    with cf.ThreadPoolExecutor(8) as ex:
        list(ex.map(fetch, items))
    print(f"{len(items)} photos in {ROOT / 'data'}")


if __name__ == "__main__":
    main()
