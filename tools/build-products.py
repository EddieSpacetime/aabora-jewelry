#!/usr/bin/env python3
"""Builds the product list from the pictures in assets/images/products/.

Run from the project folder:   py tools/build-products.py

- Scans assets/images/products/ (including sub-folders) for .jpg .jpeg .png .webp
- Works out the category from the folder or file name
  (ring, earring, necklace, bracelet, brooch, cufflink, belt / leather)
- Creates/updates data/products.csv  (open it in Excel to edit names, prices, materials)
- Writes data/products.json (what the website reads)

Extra gallery photos: name them like the main photo plus "__" and a word,
e.g. ring-1.jpg (main), ring-1__worn.jpg, ring-1__detail.jpg. They appear on that product's page.
Optional CSV columns: "for" (her / him / both) controls the gift filters; story_en/it/el/ru is a short
description shown on the product page.

Run it again whenever you add pictures or edit the CSV. Existing rows are kept.
"""
import csv, io, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets" / "images" / "products"
CSV_PATH = ROOT / "data" / "products.csv"
JSON_PATH = ROOT / "data" / "products.json"
LANGS = ["en", "it", "el", "ru"]
ORDER = ["ring", "earring", "necklace", "bracelet", "brooch", "cufflink", "belt"]
# earring must be checked before ring, because "earring" contains "ring"
KEYWORDS = [("earring", ("earring",)), ("necklace", ("necklace",)), ("bracelet", ("bracelet",)),
            ("brooch", ("brooch", "broch")), ("cufflink", ("cufflink",)), ("belt", ("belt",)),
            ("ring", ("ring",))]
EXT = {".jpg", ".jpeg", ".png", ".webp"}
NAMES = {
    "ring": ("Ring", "Anello", "Δαχτυλίδι", "Кольцо"),
    "earring": ("Earrings", "Orecchini", "Σκουλαρίκια", "Серьги"),
    "necklace": ("Necklace", "Collana", "Κολιέ", "Колье"),
    "bracelet": ("Bracelet", "Bracciale", "Βραχιόλι", "Браслет"),
    "brooch": ("Brooch", "Spilla", "Καρφίτσα", "Брошь"),
    "cufflink": ("Cufflinks", "Gemelli", "Μανικετόκουμπα", "Запонки"),
    "belt": ("Leather belt", "Cintura in pelle", "Δερμάτινη ζώνη", "Кожаный ремень"),
}
HANDMADE = ("Handmade", "Fatto a mano", "Χειροποίητο", "Ручная работа")
LEATHER = ("Leather", "Pelle", "Δέρμα", "Кожа")
PRICE = {"ring": 68, "earring": 54, "necklace": 96, "bracelet": 72, "brooch": 48, "cufflink": 85, "belt": 110}  # placeholders
FOR_DEFAULT = {"cufflink": "him", "belt": "him"}  # everything else defaults to "her"
COLS = (["id", "category", "price", "image"] + [f"name_{l}" for l in LANGS] + [f"material_{l}" for l in LANGS]
        + ["for"] + [f"story_{l}" for l in LANGS])


def natural(s):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s)]


def detect(rel):
    s = rel.lower()
    for cat, kws in KEYWORDS:
        if any(k in s for k in kws):
            return cat
    return None


def num(x, default):
    try:
        v = float(str(x).replace(",", ".").replace("€", "").strip())
        return int(v) if v == int(v) else v
    except ValueError:
        return default


def load_existing():
    rows = []
    if CSV_PATH.exists():
        lines = CSV_PATH.read_text(encoding="utf-8-sig").splitlines()
        if lines and lines[0].lower().startswith("sep="):
            lines = lines[1:]
        delim = ";" if lines[0].count(";") >= lines[0].count(",") else ","
        for r in csv.DictReader(io.StringIO("\n".join(lines)), delimiter=delim):
            if not (r.get("image") or "").strip():
                continue
            rows.append({"id": num(r.get("id", ""), None), "category": r["category"].strip(),
                         "price": num(r.get("price", ""), None), "image": r["image"].strip(),
                         "name": {l: r.get(f"name_{l}", "") for l in LANGS},
                         "material": {l: r.get(f"material_{l}", "") for l in LANGS},
                         "for": (r.get("for") or "").strip().lower(),
                         "story": {l: r.get(f"story_{l}", "") or "" for l in LANGS}})
    elif JSON_PATH.exists():
        for p in json.loads(JSON_PATH.read_text(encoding="utf-8")):
            if p.get("image"):
                rows.append({"id": p["id"], "category": p["category"], "price": p["price"], "image": p["image"],
                             "name": p["name"], "material": p["material"],
                             "for": p.get("for", ""), "story": p.get("story", {})})
    return rows


def main():
    found = {}
    for p in IMG.rglob("*"):
        if p.suffix.lower() in EXT and not p.name.lower().startswith("placeholder-"):
            found["assets/images/products/" + p.relative_to(IMG).as_posix()] = p
    if not found:
        print("No pictures found in", IMG, "- nothing changed.")
        return
    # extra gallery photos: <main-name>__<word>.jpg belongs to <main-name>.jpg in the same folder
    pure = pathlib.PurePosixPath
    extras, orphans = {}, []
    for rel in list(found):
        if "__" in pure(rel).stem:
            extras.setdefault((str(pure(rel).parent), pure(rel).stem.split("__")[0]), []).append(rel)
            del found[rel]
    mains = {(str(pure(r).parent), pure(r).stem): r for r in found}
    gallery = {}
    for key, lst in extras.items():
        if key in mains:
            gallery[mains[key]] = sorted(lst, key=natural)
        else:
            orphans += lst
    existing = load_existing()
    rows = {r["image"]: r for r in existing if r["image"] in found}
    next_id = max([r["id"] for r in existing if isinstance(r["id"], int)] + [0]) + 1
    unmatched, added = [], 0
    for img in sorted(found, key=natural):
        if img in rows:
            continue
        cat = detect(img[len("assets/images/products/"):])
        if not cat:
            unmatched.append(img)
            continue
        n = sum(1 for r in rows.values() if r["category"] == cat) + 1
        mat = LEATHER if cat == "belt" else HANDMADE
        rows[img] = {"id": next_id, "category": cat, "price": PRICE[cat], "image": img,
                     "name": {l: f"{NAMES[cat][i]} {n}" for i, l in enumerate(LANGS)},
                     "material": {l: mat[i] for i, l in enumerate(LANGS)},
                     "for": FOR_DEFAULT.get(cat, "her"), "story": {}}
        next_id += 1
        added += 1
    for r in rows.values():  # fix missing ids/prices from hand edits
        if not isinstance(r["id"], int):
            r["id"] = next_id; next_id += 1
        if r.get("for") not in ("her", "him", "both"):
            r["for"] = FOR_DEFAULT.get(r["category"], "her")
        if r["price"] is None:
            r["price"] = PRICE.get(r["category"], 50)
    final = sorted(rows.values(), key=lambda r: (ORDER.index(r["category"]) if r["category"] in ORDER else 99, natural(r["image"])))

    out = io.StringIO()
    out.write("sep=;\n")
    w = csv.writer(out, delimiter=";", lineterminator="\n")
    w.writerow(COLS)
    for r in final:
        w.writerow([r["id"], r["category"], r["price"], r["image"]] + [r["name"].get(l, "") for l in LANGS] + [r["material"].get(l, "") for l in LANGS]
                   + [r["for"]] + [r.get("story", {}).get(l, "") for l in LANGS])
    CSV_PATH.write_text(out.getvalue(), encoding="utf-8-sig")

    data = []
    for r in final:
        d = {"id": r["id"], "category": r["category"], "price": r["price"], "tone": "accent" if r["id"] % 2 else "brass",
             "name": r["name"], "material": r["material"], "image": r["image"], "for": r["for"]}
        if any(r.get("story", {}).values()):
            d["story"] = {l: v for l, v in r["story"].items() if v}
        if r["image"] in gallery:
            d["images"] = [r["image"]] + gallery[r["image"]]
        data.append(d)
    JSON_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"{len(final)} products ({added} new). Per category:")
    for c in ORDER:
        print(f"  {c:9} {sum(1 for r in final if r['category'] == c)}")
    if unmatched:
        print("\nCould not tell the category of these files (put 'ring', 'belt', etc. in the file or folder name):")
        for u in unmatched:
            print("  ", u)
    if gallery:
        print(f"\n{sum(len(v) for v in gallery.values())} extra gallery photos attached to {len(gallery)} products.")
    if orphans:
        print("\nExtra photos with no matching main photo (check the name before '__'):")
        for o in orphans:
            print("  ", o)
    print("\nNames are generic and prices are placeholders: edit data/products.csv, then run this script again.")


if __name__ == "__main__":
    main()
