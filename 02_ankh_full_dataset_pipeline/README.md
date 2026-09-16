# Process 2, Full-Dataset Validation: ANKH vs. the Entire QuadRAtlas Dataset

This is the direct answer to the professor's request: instead of checking
ANKH's similarity scoring against 6 hand-picked candidates
(NFATC4, DMKN, CHD4, EIF4G1, MOGS, PTPA), `run_ankh_full_quadratlas.py` runs
it against **every gene in QuadRAtlas** and reports a real correlation
(Pearson + Spearman) between ANKH similarity and QuadRAtlas's experimental
RG4 evidence — so "is ANKH's scoring right or not" has a dataset-wide
answer, not a 6-point anecdote.

## Why this can't run inside a locked-down sandbox

This script needs live internet access to three external services:
QuadRAtlas (gene-level RG4 scores), UniProt (protein sequences), and
HuggingFace (~1.5 GB of ANKH model weights). Environments without general
internet egress (including the sandbox this project was assembled in)
cannot reach any of these. **Run it somewhere with real internet access.**

## Recommended: Google Colab (free, has a GPU, most packages preinstalled)

1. Go to https://colab.research.google.com → New notebook.
2. Runtime → Change runtime type → GPU (optional but faster).
3. Upload `run_ankh_full_quadratlas.py`, or paste its contents into a cell.
4. Do the one manual data step below first.
5. Run it: `!python run_ankh_full_quadratlas.py` (or run the pasted cell).

## The one manual step (can't be automated)

QuadRAtlas (https://rg4db.cibio.unitn.it) is a JavaScript-rendered site
with no documented public bulk-download API. So:

1. Open https://rg4db.cibio.unitn.it in a browser.
2. Find the Download / Data page and export the full RG4 regions table as
   CSV.
3. Save it as `data/quadratlas_export.csv` (relative to this script) — or
   upload it into the same Colab session and update `QUADRATLAS_CSV` at
   the top of the script if the filename differs.

The script auto-detects the gene, normalized-score, and percentile-score
columns by common naming patterns and will print a clear error listing the
actual column names if it can't match them — check those against
`data/README.md`.

## What it does (5 steps, fully automated once the CSV is in place)

1. Loads the QuadRAtlas CSV and aggregates RG4-region rows to one row per
   gene (mean normalized score, mean percentile score, region count) —
   this aggregation logic is explicit and auditable in the code, not a
   black box.
2. Fetches the UniProt protein sequence for every gene (batched,
   rate-limited, cached/checkpointed every 50 genes so an interrupted run
   can resume).
3. Loads ANKH (`ankh.load_base_model()`, falling back to the raw
   HuggingFace `ElnaggarLab/ankh-base` weights) and embeds every sequence
   (batched, checkpointed every 10 batches, auto-detects a GPU if present).
4. Computes cosine similarity of every gene's embedding to nucleolin (NCL,
   UniProt P19338) — the same reference protein used in the original
   6-candidate analysis.
5. Merges ANKH similarity with QuadRAtlas scores across the whole dataset,
   computes Pearson and Spearman correlation, flags statistical outliers
   (the DMKN-like cases), saves a results CSV and a scatter plot with the
   trend line and correlation coefficients on it.

## Outputs

- `results/ankh_quadratlas_full_results.csv` — one row per gene: ANKH
  similarity, QuadRAtlas normalized/percentile score, region count,
  outlier flag.
- `results/ankh_vs_quadratlas_scatter.png` — all genes plotted, outliers in
  red, trend line, both correlation coefficients in the title.
- A console summary explaining how to read the result: a correlation near
  0 means ANKH's scoring is systemically disconnected from QuadRAtlas's
  experimental evidence; a moderate-to-strong correlation with a handful
  of outliers means ANKH is broadly right with specific exceptions (like
  the original DMKN case) worth investigating individually.

(Both output paths are set by the `OUTPUT_CSV` / `OUTPUT_PLOT` constants
near the top of the script — point them at `results/` if you move the
script elsewhere.)
