"""Project groups (from Proposal B) with a resident for every card, and B's two skill trees."""
import json

G = lambda title, mascot, items: {"title": title, "mascot": mascot, "items": items}


def P(slug, title, desc, who, mode, repo=None, url=None, tags=(), label=None):
    return {"slug": slug, "title": title, "desc": desc, "who": who, "mode": mode, "repo": repo or slug,
            "url": url or f"https://github.com/kevanwee/{repo or slug}", "tags": list(tags), "label": label or "github"}


projects = [
    G("highlights", "diancie", [
        P("lq-plugins", "legalquants plugins", "open-source legal plugins launched with openai's astra for law; my part: the $cite-check and playbook skills", "mega-gallade", "walk", repo="lq-plugin-oss", url="https://github.com/LegalQuants/lq-plugin-oss"),
        P("bart", "bart", "word add-in that verifies statutory citations against sso with hybrid retrieval and version-accurate matching, with a&o shearman", "mega-gardevoir", "walk", repo="-", url="https://kevanwee.vercel.app/", tags=["private"], label="portfolio"),
        P("legalbenchmarks", "legalbenchmarks.ai", "open-access benchmarks for legal ai tools; steering committee member", "silvally", "walk", repo="-", url="https://www.legalbenchmarks.ai/", label="legalbenchmarks.ai"),
        P("voracity", "voracity", "my pokémon home base: notes, reminders, legal and tech tools, a second brain, and the eevee garden", "eevee", "walk", repo="voracity", url="https://kevanwee.vercel.app/", tags=["private"], label="portfolio"),
    ]),
    G("legal engineering toolkit", "fuecoco", [
        P("sg-legal-corpus", "sg legal corpus", "statutes, case law, pdpc enforcement and hansard as one point-in-time corpus, with provenance and an mcp server", "goomy", "walk"),
        P("sg-deadline", "sg deadline", "deterministic deadline engine: rules of court 2021, limitation act, deemed receipt, every answer traced", "rowlet", "idle"),
        P("citecheck", "citecheck", "audits every citation in a draft: does the authority exist, and does it support the proposition?", "growlithe", "walk"),
        P("chronology", "chronology", "litigation chronologies as data, with pincites, provenance and evidential-gap detection", "squirtle", "walk"),
        P("oblig-register", "oblig register", "turns an executed contract into a dated obligations register with .ics reminders", "fidough", "sleep"),
        P("bundlebuild", "bundlebuild", "court bundles from a yaml index: merged pdfs, page numbers, hyperlinked index, bookmarks", "corphish", "walk"),
        P("playbook-as-code", "playbook as code", "an open schema for negotiation playbooks, with clause locator, memo and redline-ready changeset", "armarouge", "idle"),
        P("ipatlas", "ip atlas", "cross-border ip protection as cited, versioned data, answered as at a chosen date", "tyrunt", "walk"),
        P("copycat", "copycat", "singapore-first copyright infringement triage tool with deterministic similarity scoring", "skitty", "walk"),
        P("sightstone", "sightstone", "contract playbook harmonisation tool", "umbreon", "sleep"),
        P("sal-citation-generator", "sal citation generator", "footnote generator using the sal style guide", "jolteon", "walk", tags=["wip"]),
        P("apac-lateral-tracker", "apac lateral tracker", "partner lateral-movement intelligence for apac legal markets", "breloom", "walk"),
    ]),
    G("legal data &amp; analytics", "fuecoco", [
        P("pdpcscraper", "pdpc scraper", "pdpc enforcement decisions on the protection obligation, with trend analysis", "appletun", "idle"),
        P("elitiscraper", "eliti scraper", "elitigation sghc/sgca judgment scraper using beautifulsoup4", "flareon", "walk"),
        P("sgstatutescraper", "sg statute scraper", "singapore statutes online scraper", "vaporeon", "walk", tags=["wip"]),
        P("hansardscraper", "hansard scraper", "singapore parliamentary debate scraper", "sylveon", "sleep", tags=["wip"]),
        P("codeoflaw", "codeoflaw", "statistical analysis on all reported sghc and sgca judgments", "charcadet", "walk", tags=["wip"]),
        P("crimewatch", "crimewatch", "heatmap of locations mentioned in sg criminal law judgments", "zorua", "walk"),
        P("justicegap", "justicegap", "how far people are from legal help, by location and legal problem", "hisuian-zorua", "idle", tags=["wip"]),
        P("lexlynx", "lex lynx", "openai wrapper that summarizes case law", "arcanine", "sleep"),
        P("tortrat", "tort rat", "rag-powered discord chatbot for sg tort law", "pawmi", "walk"),
    ]),
    G("intelligence analysis tools", "froakie", [
        P("hawkshot", "hawk shot", "line-of-sight / viewshed analysis tool", "rowlet", "walk"),
        P("mapmole", "map mole", "satellite imagery change detection", "gible", "walk"),
    ]),
    G("art", "teddiursa", [
        P("lolpixelart", "lol pixel art", "pixel art for league of legends skins", "teddiursa", "walk"),
    ]),
    G("others", "jirachi", [
        P("voracity-watcher", "voracity watcher", "polite site watcher: obeys robots.txt and sends changes to telegram via ica", "growlithe", "idle"),
        P("theoffice", "the office", "vs code extension: animated pokémon that follow your ai agents as they code", "froakie", "walk"),
        P("pmdsvgworld", "pmd svg world", "a pokémon mystery dungeon-style world as one self-contained, github-embeddable svg", "dratini", "walk"),
        P("kevanwee", "kevanwee portfolio", "this portfolio site", "fuecoco", "walk"),
        P("kevanweeportfolio", "3d portfolio", "javascript-based website that displays 3d objects", "shiny-dratini", "idle"),
        P("bookworm", "book worm", "book price scraper: amazon, kinokuniya, thryft", "eevee", "sleep"),
        P("huhh", "huhh", "an april fools joke", "hisuian-zorua", "walk", repo="HUHH", url="https://github.com/kevanwee/HUHH"),
    ]),
]

trees = [
    ["tech tree", [["legal engineering", "rules as data, deterministic engines with derivation traces, mcp servers, claude skills"],
                   ["ai", "rag, hybrid retrieval (bm25 + dense + reranking), llm evaluation, local models (ollama)"],
                   ["web dev", "typescript, react, next.js, firebase, office.js add-ins"],
                   ["scripting & data", "python (fastapi, pandas etl, nlp), java, js, php"],
                   ["data stores", "mysql, chromadb, firestore"],
                   ["security", "defi vulnerability research, solidity, ztna"],
                   ["gis", "arcgis products, qgis, global mapper, geospatial data production"],
                   ["3d & games", "blender, unity (but it's been a decade)"]]],
    ["everything-else tree", [["legaltech", "clm, e-discovery (relativityone), aml/kyc-ctf, document and practice management"],
                              ["law", "ip and brand protection, data protection, contract, civil and criminal litigation"],
                              ["intelligence", "imint, geoint, osint"],
                              ["cartography", "topographic maps, orthoimage maps, situation maps (disaster relief/change assessment)"],
                              ["geomatics", "georectification, orthorectification, mosaicing, stereophotogrammetry"]]],
]

if __name__ == "__main__":
    json.dump(projects, open("projects.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(trees, open("trees.json", "w", encoding="utf-8"), indent=1)
    d = json.load(open(r"C:/Users/garma/Documents/CNL/side projects/voracity/src/pokemon/overworld-sprites.json", encoding="utf-8"))
    need = {(p["who"], {"walk": "Walk", "idle": "Idle", "sleep": "Sleep"}[p["mode"]]) for g in projects for p in g["items"]}
    need |= {(s, "Walk") for s in ["zorua", "hisuian-zorua", "talonflame", "mega-gardevoir", "mega-gallade", "growlithe", "arcanine", "corviknight",
                                   "fuecoco", "froakie", "teddiursa", "fidough", "noivern", "gible", "squirtle", "charcadet"]} | {("pawmi", "Sleep"), ("fuecoco", "Sleep")}
    print("missing:", [n for n in need if n[0] not in d or n[1] not in d[n[0]]["animations"]])
    print("flying:", [s for s in ["talonflame", "corviknight", "noivern"] if d[s].get("flying")])
