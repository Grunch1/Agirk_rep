The shared title list is `test.aghvesagirk.com/Lemma/section-index.json`:

```json
{
  "section-5764120.json": "Աղքատ մսախորով և արծիւ 1"
}
```

Edit titles in `test.aghvesagirk.com/Lemma/converted/section-*.json`, then run:

```sh
node Tools/generate-section-index.js
```

The command keeps each title exactly as written in its section JSON, sorts with
Armenian alphabetical order and natural numeric suffixes, and rebuilds the shared
list. It also updates the first seven sections hardcoded in `reading.js`, every
numbered row and section link in `Home.html#Edition`, and the legacy
`Lemma/index-panel.html` artifact. Home and reading pages load the shared JSON
list. Reading builds its first
seven boxes synchronously when the script starts, before loading the full list.

Do not edit these generated titles separately. Invalid section JSON, missing
titles, mismatched `sectionId` values, or missing script markers or HTML anchors stop generation
before any output is changed. The command works from any directory when given
the script's path. The former `Tools/GenerateDivs/generateDivs.js` command also
runs this generator.
