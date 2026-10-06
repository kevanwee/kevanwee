"""Proposal A (v2): the README in the garden's style. Writes design.md; art lives in ./readme/art/."""
import json
from pathlib import Path

ART = "./readme/art"
projects = json.loads(Path("projects.json").read_text(encoding="utf-8"))


def themed(name, alt, width=None, href=None):
    w = f' width="{width}"' if width else ""
    pic = (f'<picture><source media="(prefers-color-scheme: dark)" srcset="{ART}/{name}-dark.svg" />'
           f'<img src="{ART}/{name}-light.svg" alt="{alt}"{w} /></picture>')
    return f'<a href="{href}">{pic}</a>' if href else pic


import cast


def path(name, alt=None):
    (a, b), flyer = cast.PATHS[name]
    alt = f"{a.replace('-', ' ')} and {b.replace('-', ' ')} on the path"
    return f'<p align="center"><img src="{ART}/path-{name}.svg" alt="{alt}" /></p>'


def recipes():
    out = []
    for group in projects:
        out.append(f'<h3 align="center"><img src="{ART}/mascot-{group["mascot"]}.svg" height="26" /> &nbsp;{group["title"]}</h3>\n')
        items = group["items"]
        # One paragraph per group: rows split by <br>, so the residents' lane is the only gap
        rows = ["\n".join(themed(f'card-{p["slug"]}', p["title"], "49%", p["url"]) for p in items[i:i + 2]) for i in range(0, len(items), 2)]
        out.append('<p align="center">\n' + "\n<br>\n".join(rows) + '\n</p>\n')
    return "\n".join(out)


badges_tech = """  <div align="center">
    <img src="https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" />
    <img src="https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB" />
    <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white" />
    <img src="https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white" />
    <img src="https://img.shields.io/badge/Firebase-DD2C00?style=flat&logo=firebase&logoColor=white" />
    <img src="https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white" />
    <img src="https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white" />
    <img src="https://img.shields.io/badge/PHP-777BB4?style=flat&logo=php&logoColor=white" />
    <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white" />
    <img src="https://img.shields.io/badge/Ollama-000000?style=flat&logo=ollama&logoColor=white" />
    <img src="https://img.shields.io/badge/Claude-D97757?style=flat&logo=claude&logoColor=white" />
    <img src="https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white" />
    <img src="https://img.shields.io/badge/Blender-F5792A?style=flat&logo=blender&logoColor=white" />
    <img src="https://img.shields.io/badge/Unity-000000?style=flat&logo=unity&logoColor=white" />
  </div>"""

readme = f"""<div align="center">
  <img src="./readme/bardnner.gif" alt="banner" />
</div>

<br>

<p align="center">
  <strong>welcome to the rat den 🐀</strong>
</p>

<p align="center">
  <em>computing &amp; law major &nbsp;·&nbsp; aspiring legal technologist &nbsp;·&nbsp; ex cartographer &nbsp;·&nbsp; intelligence practitioner &nbsp;·&nbsp; failing artist &nbsp;·&nbsp; coffee addict</em>
</p>

<p align="center">
  <a href="https://kevanwee.vercel.app/"><img src="https://img.shields.io/badge/🌐 portfolio-visit-1a1a2e?style=for-the-badge" alt="portfolio" /></a>
  &nbsp;
  <a href="https://www.linkedin.com/in/kevanwee/"><img src="https://img.shields.io/badge/LinkedIn-connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="linkedin" /></a>
  &nbsp;
  <a href="mailto:kevan.wee.2023@scis.smu.edu.sg"><img src="https://img.shields.io/badge/email-reach_out-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="email" /></a>
</p>

<p align="center">
  <a href="#cooking">🍜 cooking</a> &nbsp;·&nbsp;
  <a href="#cuisines">🍳 cuisines</a> &nbsp;·&nbsp;
  <a href="#recipes">🍽️ recipes</a> &nbsp;·&nbsp;
  <a href="#contacts">📮 contacts</a>
</p>

<p align="center">
  {themed("contribution-garden", "a year of contributions beside the eevee forest")}
</p>

<a name="cooking"></a>

{path("zorua", "zorua and hisuian zorua on the path")}

<details>
  <summary align="center"><h2>🍜 &nbsp;what's cooking?</h2></summary>

  <br>

  <div align="center">
    <img src="./readme/ramen.gif" alt="ramen" />
  </div>

  <br>

  <p align="center">
    probably some nissin laksa and a cup of instant coffee...
    <br><br>
    a wise rat once said <em>"anyone can cook"</em> 👨‍🍳 — i build everything and anything!
  </p>

  <!-- garden:stove (regrown daily) -->
  <p align="center">
    {themed("stove", "recently pushed repositories", href="https://github.com/kevanwee?tab=repositories")}
  </p>

  <p align="center">
    <a href="https://www.legalquants.com/lawyers/kevan-wee"><img src="https://img.shields.io/badge/LegalQuants-Member-163355?style=flat-square" /></a>
    &nbsp;
    <a href="https://www.legalbenchmarks.ai/framework"><img src="https://img.shields.io/badge/LegalBenchmarks.ai-Steering_Committee-5B2D8E?style=flat-square&logo=openai&logoColor=white" /></a>
    &nbsp;
    <a href="https://www.mensa.org.sg/"><img src="https://img.shields.io/badge/Mensa-Member-CC0000?style=flat-square" /></a>
  </p>

  <br>

</details>

<a name="cuisines"></a>

{path("gardevoir", "mega gardevoir and mega gallade on the path")}

<details>
  <summary align="center"><h2>🍳 &nbsp;what cuisines do you specialise in? &nbsp;<img src="./readme/slowitsgood.gif" width="80" /></h2></summary>

  <br>

  <div align="center">
    <img src="./readme/cooking.gif" alt="cooking" />
  </div>

  <br>

  <p align="center">
    as someone studying both computing and law, i suffer from every conceivable <em>"jack of all trades"</em> stereotype<br>
    but i primarily specialise in <strong>legaltech product management and digital transformation</strong> 👨‍💻<br>
    <em>(think video game where you refuse to pick a class and unlock skills in every tree 🗡️)</em>
  </p>

  <p align="center">
    {themed("trees", "tech tree and everything-else tree")}
  </p>

{badges_tech}

  <br>

</details>

<a name="recipes"></a>

{path("growlithe", "growlithe and arcanine on the path")}

<details>
  <summary align="center"><h2>🍽️ &nbsp;what recipes have you come up with?</h2></summary>

  <br>

  <p align="center">here's some of the dishes i've made recently! (and some works in progress) 🍽️🛠️</p>

  <div align="center">
    <img src="./readme/totoro.gif" alt="totoro" />
  </div>

  <br>

{recipes()}

  <br>

</details>

{path("starters", "fuecoco and froakie on the path")}

<p align="center">
  {themed("playground", "mega evolution and soul unison")}
</p>

<div align="center">
  <img src="./readme/pokemon-roam-mauville.svg" alt="pokemon roaming" />
</div>


<a name="contacts"></a>

{path("teddiursa", "teddiursa and fidough on the path")}

<h2 align="center">contacts!</h2>

<div align="center">
  <img src="./readme/totorosmile.gif" alt="totoro smile" />
</div>

<p align="center">
  want to talk about anything across tech, law and art?
  <br><br>
  📧 email me at <a href="mailto:kevan.wee.2023@scis.smu.edu.sg">kevan.wee.2023@scis.smu.edu.sg</a>
  <br>
  🔗 connect with me: &nbsp;<a href="https://www.linkedin.com/in/kevanwee/">linkedin</a> &nbsp;·&nbsp; <a href="https://www.instagram.com/kwjw30/">instagram</a>
  <br>
  🎨 art accounts: &nbsp;<a href="https://www.instagram.com/van.fullofkebabs/">instagram</a> &nbsp;·&nbsp; <a href="https://www.tiktok.com/@seofon30">tiktok</a>
  <br><br>
  feel free to reach out!
  <br><br>
  <img src="./readme/pokemon-roam-rt111.svg" alt="pokemon roaming rt111" />
</p>
"""
Path("design.md").write_text(readme, encoding="utf-8")
print("ok", len(readme))

# ---- A+: the same README with more of it drawn as SVG ----
def swap(text, start, end, new):
    i = text.index(start); j = text.index(end, i) + len(end)
    return text[:i] + new + text[j:]

more = readme
more = swap(more, '<p align="center">\n  <strong>welcome', 'coffee addict</em>\n</p>', f'<p align="center">\n  {themed("header", "welcome to the rat den")}\n</p>')
more = swap(more, '<p align="center">\n  <a href="#cooking">', '</a>\n</p>',
            '<p align="center">\n' + "\n".join(f'  {themed(f"nav-{k}", k, href="#" + k)}' for k in ["cooking", "cuisines", "recipes", "contacts"]) + '\n</p>')
for key, emoji_title, gif in [("cooking", "<h2>🍜 &nbsp;what's cooking?", ''),
                              ("cuisines", "<h2>🍳 &nbsp;what cuisines do you specialise in?", '<img src="./readme/slowitsgood.gif" width="80" />'),
                              ("recipes", "<h2>🍽️ &nbsp;what recipes have you come up with?", '')]:
    more = swap(more, emoji_title, '</h2>', f'{themed(f"sign-{key}", key)} {gif}')
more = swap(more, '  <p align="center">\n    probably some nissin', '</p>', f'  <p align="center">\n    {themed("note-cooking", "anyone can cook")}\n  </p>')
more = swap(more, '  <p align="center">\n    as someone studying', '</p>', f'  <p align="center">\n    {themed("note-cuisines", "jack of all trades")}\n  </p>')
more = swap(more, '<h2 align="center">contacts!', '</h2>', f'<p align="center">{themed("sign-contacts", "contacts")}</p>')
contact_chips = "\n".join(f'  {themed(f"contact-{k}", label, href=url)}' for k, label, url in [
    ("email", "email", "mailto:kevan.wee.2023@scis.smu.edu.sg"), ("linkedin", "linkedin", "https://www.linkedin.com/in/kevanwee/"),
    ("instagram", "instagram", "https://www.instagram.com/kwjw30/"), ("art-instagram", "art instagram", "https://www.instagram.com/van.fullofkebabs/"),
    ("tiktok", "tiktok", "https://www.tiktok.com/@seofon30")])
more = swap(more, '<p align="center">\n  want to talk', '</p>',
            f'<p align="center">\n  {themed("note-contacts", "want to talk")}\n</p>\n\n<p align="center">\n{contact_chips}\n</p>\n\n'
            '<p align="center">\n  <img src="./readme/pokemon-roam-rt111.svg" alt="pokemon roaming rt111" />\n</p>')
more += """
<p align="center"><sub>
  sprites by the <a href="https://sprites.pmdcollab.org/">PMD Sprite Collab</a> contributors · item icons via <a href="https://github.com/PokeAPI/sprites">PokeAPI</a> ·
  mega evolution symbol by pixelthecollector · drawn and regrown daily by <a href="./genpokemon/readme_art">genpokemon/readme_art</a>
</sub></p>
"""
Path("more.md").write_text(more, encoding="utf-8")
print("more", len(more))
