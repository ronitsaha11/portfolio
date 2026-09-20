# public/

Static assets served from the site root.

## resume.pdf

`site.resume` in `src/data/site.ts` points at `/resume.pdf`, and five
places read that one value: the hero action, the masthead, the mobile
sheet, the contact section and the command palette. Change it once and
all five follow.

The PDF **is** committed. It is the résumé as supplied — not
regenerated, not reformatted, not edited — and it is the document the
deployed site serves at
<https://proof-navy.vercel.app/resume.pdf>.

A `.pdf` href opens in its own tab wherever it appears. That is
deliberate: replacing the page with a PDF viewer throws away the
reader's position in a forty-thousand-pixel document and leaves the
Back button as the only way home. The rule lives in `LinkButton`
(`src/components/primitives/Button.tsx`) alongside the external-link
rule, so no caller has to remember it.

To serve the file from somewhere else instead, point `site.resume` at
an absolute URL — the components detect it and add `target="_blank"`
and `rel="noopener noreferrer"` on their own.
