# Project story previews

Three new hover/focus videos are built with [Brag](https://github.com/latent-spaces/brag) and Hyperframes 0.8.186. Each identifies the intended user, demonstrates a specific task, and shows the result or decision. The existing Scrum preview is the reference for this story structure.

| Preview | Story | Provenance and boundary |
| --- | --- | --- |
| LegalQuants Plugins · 25s | Compare a claim with its supplied source; map Fees to Charges; block a scope mismatch; explain a gated statutory hand-off | Real report-renderer and term-map/adaptation outputs from the public source on fictional inputs. Semantic assessments and equivalence judgments were supplied explicitly for the demonstration; lawyer review remains pending. The cite-check → regulatory hand-off is a **proposal**, not an automatic capability claimed to ship. Credit is review and contribution to citation-checking and contract-playbook workflows, not sole authorship. |
| BART · 22s | Scan inside Word; inspect the version flag and source excerpt; find the Accept/Reject decision | Authentic project screenshots already published in the portfolio case study, with a deterministic inspection pan. Recorded case-study walkthrough, **not a live Word session** or fresh legal-currentness check. Team project attribution is retained. |
| SAL Citation · 22s | Enter a source; cite it again; change a pinpoint; inspect Ibid/Id in the preview | A recording of the actual local app with fictional case details. Presentation-only framing collapses the masthead and scrolls the source panel independently so both panels remain visible; citation logic and controls are unchanged. Formatting is not authority verification. |

All three retain the current cream/sage portfolio visual language and use local assets. Videos are muted in the portfolio's hover previews. With reduced motion, the existing component displays the selected poster instead. Keyboard focus and Escape dismissal use the same existing preview behavior.

No Pokemon sprites occur inside these three products' demo screens. The portfolio's native resident sprites remain in the host and are checked for loaded sprite sheets, advancing animation frames and no preview-related regression. They are not replaced with generated approximations.

## Authoring and reproduction

Editable compositions and storyboards are under `portfolio/demos/`. Run the preparation helper there with a Brag installation to copy its bundled music/SFX and the existing local fonts into each ignored composition asset folder. The SAL source recording is retained as a small fictional-data fixture. BART reads the public case-study images already in this repository.

Each film has a `brag-plan.md`, `composition-brief.md`, `SPEC.md` and `REVIEW.md`. Hyperframes checks run before render; selected settled posters are baked into frame zero. Public MP4/JPG pairs live under `portfolio/public/previews/`, and `src/data/index.ts` attaches them to the three project cards. Existing previews are preserved.

Audio: Brag's bundled Happy Beats / Business Moves vol-12 by ende.app, with CC0 Kenney UI clicks. No voiceover. Audio is measured for presence and peaks; perceptual listening is not claimed.
