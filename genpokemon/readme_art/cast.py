"""Who appears where, so every resident is used once. Excluded by the owner from the count: the
garden's Eeveelutions, the tab mascots on headings/nav/signs, and the playground cast."""
import collections, json, random

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
HEADER = [("tandemaus", "walk"), ("appletun", "idle")]
NOTES = {"cooking": [("piplup", "walk"), ("shiny-meowstic-f", "idle")],
         "cuisines": [("infernape", "walk"), ("mega-dragonite", "idle")],
         "contacts": [("pikachu", "walk"), ("electrike", "walk")]}
CHIPS = {"email": "shieldon", "linkedin": "shiny-kingambit", "instagram": "tatsugiri-stretchy", "art-instagram": "shiny-mega-gengar", "tiktok": "shedinja"}
RANDOM = ("?", "walk")  # an open spot: filled at build time from the Pokémon not on the page yet
# Kept out of the random pool: the garden's Eeveelutions, the tab mascots, the playground cast,
# and the ones too large to stand on a card edge.
EXCLUDED = {"vaporeon", "jolteon", "flareon", "umbreon", "sylveon", "teddiursa", "fuecoco", "froakie", "jirachi", "diancie",
            "mega-diancie", "ceruledge", "greninja", "mega-greninja", "dragonite", "shiny-mega-dragonite", "ironvaliant", "yveltal",
            "darkrai", "zygarde", "armarouge", "mega-rayquaza", "primal-kyogre"}
CARDS = {
    "lq-plugins": ("kleavor", "walk"), "bart": ("solgaleo", "idle"), "legalbenchmarks": ("silvally", "walk"), "voracity": ("eevee", "walk"),
    "sg-legal-corpus": ("goomy", "walk"), "sg-deadline": ("rowlet", "idle"), "citecheck": ("mega-absol", "walk"), "chronology": ("shiny-trapinch", "walk"),
    "oblig-register": ("fidough", "sleep"), "bundlebuild": ("corphish", "walk"), "playbook-as-code": ("entei", "idle"), "ipatlas": ("tyrunt", "walk"),
    "copycat": ("skitty", "walk"), "sightstone": ("shiny-cranidos", "sleep"), "sal-citation-generator": ("shiny-treecko", "walk"), "apac-lateral-tracker": ("breloom", "walk"),
    "pdpcscraper": RANDOM, "elitiscraper": ("mega-zeraora", "walk"), "sgstatutescraper": ("dragonair", "walk"), "hansardscraper": ("shadow-mewtwo", "idle"),
    "codeoflaw": ("shiny-mudkip", "walk"), "crimewatch": ("buizel", "walk"), "justicegap": ("shiny-turtwig", "idle"), "lexlynx": ("miraidon", "sleep"),
    "tortrat": ("beautifly", "walk"), "hawkshot": ("swellow", "walk"), "mapmole": ("giratina", "idle"), "lolpixelart": ("shiny-ditto", "walk"),
    "voracity-watcher": ("crobat", "idle"), "theoffice": ("mega-skarmory", "walk"), "pmdsvgworld": ("zapdos", "walk"), "kevanwee": ("naganadel", "walk"),
    "kevanweeportfolio": ("jirachi", "idle"), "bookworm": ("primal-kyogre", "sleep"), "huhh": ("mega-rayquaza", "idle"),
}



def used_species():
    used = []
    for pair, flyer in PATHS.values(): used += list(pair) + ([flyer] if flyer else [])
    used += PLAYGROUND_PATH + [s for s, _ in STOVE + TREES + HEADER] + [s for v in NOTES.values() for s, _ in v] + list(CHIPS.values()) + [s for s, _ in CARDS.values()]
    return used


def fill_open_spots(rng=random.SystemRandom()):
    """Give each open card spot a random Pokémon that isn't on the page yet."""
    from pmd import META, PICKS, PUBLIC
    # Only Pokémon whose sheets are here: all of Voracity's with VORACITY_SRC, the bundled subset otherwise
    drawable = set(PICKS) | {s for s, m in META.items() if (PUBLIC / m["animations"]["Walk"]["src"].lstrip("/")).exists()}
    pool = sorted(s for s in drawable if not s.startswith("silvally-") and s not in EXCLUDED and s not in used_species())
    for slug, (species, mode) in CARDS.items():
        if species != "?": continue
        if not pool: raise SystemExit(f"no Pokémon left for {slug}: add more to the pool")
        pick = rng.choice(pool); pool.remove(pick)
        CARDS[slug] = (pick, mode)
        print(f"{slug}: {pick} (random from {len(pool) + 1})")


if __name__ == "__main__":
    fill_open_spots()
    c = collections.Counter(used_species())
    print("slots", sum(c.values()), "distinct", len(c))
    print("repeats:", {k: v for k, v in c.items() if v > 1})
    projects = json.load(open("projects.json", encoding="utf-8"))
    print("cards missing:", {p["slug"] for g in projects for p in g["items"]} - set(CARDS))
