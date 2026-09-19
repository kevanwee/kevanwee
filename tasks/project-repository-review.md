# Portfolio repository review — 19 September 2026

Selection criteria: implemented functionality, documented setup and examples, evidence of working outputs, and a distinct contribution to the portfolio. A portfolio listing does not imply production readiness or independent legal validation.

Reviewed the public GitHub inventory and inspected README/file trees for 15 additional candidates. Downloaded three shortlisted repositories to a temporary directory, read their core implementation and tests, and ran their existing suites without modifying those repositories.

## Added to Other noteworthy projects

| Repository | Evidence checked | Validation |
| --- | --- | --- |
| [bundlebuild](https://github.com/kevanwee/bundlebuild/tree/94f51e4a3885d9da15ef99fe02fb70b43762fe29) | Implemented PDF assembly, input checks, numbering, linked index and bookmarks; CLI and example manifests | 8 tests passed, including generated PDF contents, links, bookmarks, missing inputs and CLI |
| [playbook-as-code](https://github.com/kevanwee/playbook-as-code/tree/80425a0dc6e43b523cd8218862b940754452d695) | Open playbook schema, three reference playbooks, clause matching, sample assessments, memo and amendment output | 11 tests passed, including clause matching, validation, memo/changeset generation and CLI |
| [crimewatch](https://github.com/kevanwee/crimewatch/tree/0927dca2b392f7852a80779ae85df7b9676de259) | Judgment extraction, contextual location scoring, weighted heatmaps, Flask API and map frontend | 6 tests passed, covering location extraction, aggregation and the API |

These provide three distinct examples: document assembly, contract review tooling, and legal-data visualisation. Cards describe implemented functionality and link to source; no hosted demo availability is claimed. CrimeWatch describes *likely* incident locations, since it infers locations from judgments and uses area centroids.

## Other candidates considered

| Repository | Decision for this update |
| --- | --- |
| citecheck | Implemented library, CLI and tests documented; overlaps the featured citation work and LegalQuants contribution. Keep as a future option. |
| chronology | Implemented schema, merge, conflict and gap checks documented; a future litigation-tooling addition. |
| oblig-register | Implemented register validation, date resolution and calendar export documented; a future contract-operations addition. |
| apac-lateral-tracker | Substantial pipeline and evaluation suite; README documents limited recall and no dashboard. A credible future data-engineering feature, rather than another card in this update. |
| pdpcscraper | Runnable scraper and analyser with committed outputs; overlaps the existing scraper cards. |
| mapmole / hawkshot | Documented geospatial tools with UI/CLI implementations; Hawkshot also includes tests. Better suited to a broader technical-project selection. |
| theoffice | Substantial VS Code extension with build instructions and Pokémon assets; a future developer-tooling feature. |
| ipatlas | Phase-one engine implemented, but README explicitly marks all legal data unverified and identifies unimplemented later phases. Defer. |
| sg-deadline | Implemented computation engine, but README explicitly marks all bundled rules and holiday data unverified. Defer. |
| justicegap | README describes a work-in-progress demo with mock services. Defer. |
| lexlynx | Small case-summary wrapper; less distinctive than the selected tools. |

Only the three additions were executed locally; the remaining observations are based on repository documentation and structure, not a full functional audit. Fork status was considered to avoid presenting unrelated upstream work as an original project.

## Copy changes

- Copycat: “Copyright infringement triage for Singapore law, with deterministic similarity scoring.”
- LegalQuants contribution: “My contributions focused on the $cite-check and playbook skills.” The role label now reads “Contributor · Citation checking & playbooks”.
