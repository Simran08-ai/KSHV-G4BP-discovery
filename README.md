# AI-Driven G4–G4BP Discovery in KSHV

A computational pipeline that uses **ANKH protein language-model embeddings** to identify novel nucleolin-like RNA G-quadruplex binding protein (RG4BP) candidates from QuadRAtlas data.

The core idea: nucleolin is a well-characterised RG4-binding protein. By embedding proteins with ANKH and ranking them by similarity to nucleolin, we surface previously unannotated candidates worth investigating — with **ANKRD11** emerging as the top novel hit.

---

## What's in this repo

| Folder | Contents |
|--------|----------|
| `02_ankh_full_dataset_pipeline/` | The main pipeline — parsing QuadRAtlas, building the gene table, running ANKH embeddings + similarity scoring across the full dataset. Includes scripts, a small data export, and results. |
| `03_deliverable_documents/` | The finished write-up (Word summary) and the generator scripts that build it. |

Top-level files: `environment.yml`, `requirements.txt`, `setup.sh` (environment setup) and this README.

---

## The pipeline

Inside `02_ankh_full_dataset_pipeline/`:

- **`parse_pg_dump.py`** — parses the QuadRAtlas database dump into usable tables
- **`build_gene_table.py`** — assembles the gene-level table the pipeline runs on
- **`run_ankh_full_quadratlas.py`** — the main script: generates ANKH embeddings, embeds nucleolin as the reference, and ranks all candidates by cosine similarity

**`data/`** holds a small QuadRAtlas export (`quadratlas_export.csv`). The full raw database dump and the cached embeddings are **not included** here (they're large and re-generable) — see `data/README.md` for how to obtain / rebuild them.

**`results/`** holds the output:
- `ankh_quadratlas_full_results.csv` — full similarity-ranked candidate table
- `ankh_vs_quadratlas_scatter.png` — visualisation of the results

---

## Key result

| Candidate | Cosine similarity to nucleolin | Note |
|-----------|-------------------------------|------|
| **ANKRD11** | 0.724 | Top novel candidate (+81% over GAPDH control) |
| SEPTIN9 | 0.687 | |
| FN1 | 0.580 | |

---

## Setup

Two ways to set up the environment — pick one:

**Option A — conda (recommended)**
```bash
conda env create -f environment.yml
```

**Option B — pip**
```bash
pip install -r requirements.txt
```

Or run `setup.sh` if you're on a Unix-like shell.

---

## Methods & tools

`Python` · ANKH protein language model · cosine similarity · pandas · QuadRAtlas dataset

---

## Notes

This is a research project exploring an embedding-based approach to RG4BP discovery. Results are computational predictions and would need experimental validation. The raw database dump and embedding cache are excluded from the repo for size reasons; everything needed to reproduce them is described in the relevant folder READMEs.
