# Deliverable Documents

The two documents ready to hand in or present, plus the scripts that
generated them (kept for reproducibility — you don't need to touch these
to use the finished files).

| File | What it is |
|---|---|
| `Genomic_Search_Project_Slides.pptx` / `.pdf` | 20-slide deck: the biology, the two discovery processes (docking + ANKH), the mismatch that turned up, the professor's corrections, and next steps |
| `Genomic_Search_Summary_and_Corrections.docx` / `.pdf` | Full written summary: what was done, how the QuadRAtlas candidates were found, the mismatch, the two corrections (cosine similarity range; QuadRAtlas vs. ANKH measure different things), and the two-part future work plan |
| `generators/build_deck_simple.js` | Node script (uses `pptxgenjs`) that builds the slide deck from scratch |
| `generators/build_summary_doc.js` | Node script (uses the `docx` package) that builds the Word document from scratch |

## Regenerating a document after an edit

Only needed if you want to change wording/layout via the generator script
rather than editing the .docx/.pptx directly in Word/PowerPoint.

```bash
npm install --no-save docx pptxgenjs     # or: ./setup.sh from the project root
cd 03_deliverable_documents/generators
node build_summary_doc.js                 # writes ../Genomic_Search_Summary_and_Corrections.docx
node build_deck_simple.js                 # writes ../Genomic_Search_Project_Slides_Simple.pptx
```

Both scripts still have their *original* absolute output paths hard-coded
(`/tmp/report/...`, from the sandbox they were first built in) — edit the
`pres.writeFile(...)` line at the bottom of `build_deck_simple.js` and the
`fs.writeFileSync(...)` line at the bottom of `build_summary_doc.js` to
point at wherever you're running them before you `node` either one.
