"""Who appears where, so every resident is used once. Excluded by the owner from the count: the
garden's Eeveelutions, the tab mascots on headings/nav/signs, and the playground cast."""
import collections, json

PATHS = {  # name: ((lead, follower), flyer or None)
    "zorua": (("zorua", "hisuian-zorua"), "talonflame"),
    "gardevoir": (("mega-gardevoir", "mega-gallade"), None),
    "growlithe": (("growlithe", "arcanine"), "corviknight"),
    "starters": (("charmander", "quilava"), "spearow"),
    "teddiursa": (("sandshrew", "alolan-sandshrew"), "noivern"),
}
PLAYGROUND_PATH = ["shiny-dratini", "dratini"]
STOVE = [("charcadet", "walk"), ("shiny-ponyta", "sleep")]
TREES = [("gible", "walk"), ("squirtle", "walk"), ("pawmi", "sleep")]
HEADER = [("tandemaus", "walk"), ("dachsbun", "sleep")]
NOTES = {"cooking": [("piplup", "walk"), ("shiny-meowstic-f", "idle")],
         "cuisines": [("infernape", "walk"), ("mega-dragonite", "idle")],
         "contacts": [("pikachu", "walk"), ("electrike", "walk")]}
CHIPS = {"email": "shieldon", "linkedin": "shiny-kingambit", "instagram": "tatsugiri-stretchy", "art-instagram": "shiny-mega-gengar", "tiktok": "shedinja"}
CARDS = {
    "lq-plugins": ("kleavor", "walk"), "bart": ("solgaleo", "idle"), "legalbenchmarks": ("silvally", "walk"), "voracity": ("eevee", "walk"),
    "sg-legal-corpus": ("goomy", "walk"), "sg-deadline": ("rowlet", "idle"), "citecheck": ("mega-absol", "walk"), "chronology": ("shiny-trapinch", "walk"),
    "oblig-register": ("fidough", "sleep"), "bundlebuild": ("corphish", "walk"), "playbook-as-code": ("entei", "idle"), "ipatlas": ("tyrunt", "walk"),
    "copycat": ("skitty", "walk"), "sightstone": ("shiny-cranidos", "sleep"), "sal-citation-generator": ("shiny-treecko", "walk"), "apac-lateral-tracker": ("breloom", "walk"),
    "pdpcscraper": ("appletun", "idle"), "elitiscraper": ("mega-zeraora", "walk"), "sgstatutescraper": ("dragonair", "walk"), "hansardscraper": ("shadow-mewtwo", "idle"),
    "codeoflaw": ("shiny-mudkip", "walk"), "crimewatch": ("buizel", "walk"), "justicegap": ("shiny-turtwig", "idle"), "lexlynx": ("miraidon", "sleep"),
    "tortrat": ("beautifly", "walk"), "hawkshot": ("swellow", "walk"), "mapmole": ("giratina", "idle"), "lolpixelart": ("shiny-ditto", "walk"),
    "voracity-watcher": ("crobat", "idle"), "theoffice": ("mega-skarmory", "walk"), "pmdsvgworld": ("zapdos", "walk"), "kevanwee": ("naganadel", "walk"),
    "kevanweeportfolio": ("jirachi", "idle"), "bookworm": ("primal-kyogre", "sleep"), "huhh": ("mega-rayquaza", "idle"),
}

if __name__ == "__main__":
    used = []
    for pair, flyer in PATHS.values(): used += list(pair) + ([flyer] if flyer else [])
    used += PLAYGROUND_PATH + [s for s, _ in STOVE + TREES + HEADER] + [s for v in NOTES.values() for s, _ in v] + list(CHIPS.values()) + [s for s, _ in CARDS.values()]
    c = collections.Counter(used)
    print("slots", len(used), "distinct", len(c))
    print("repeats:", {k: v for k, v in c.items() if v > 1})
    projects = json.load(open("projects.json", encoding="utf-8"))
    print("cards missing:", {p["slug"] for g in projects for p in g["items"]} - set(CARDS))
