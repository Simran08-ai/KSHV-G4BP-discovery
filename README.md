# Genomic Search Proposal: AI-Driven G4–G4BP Discovery in KSHV

Submission-ready project folder — everything produced for this project,
organized by process, with the environment needed to reproduce or extend
any of it.

## Directory guide

| Folder | Contents |
|---|---|
| `00_source_material/` | The original 227-page source PDF everything here is built from |
| `01_diagrams/` | The 3 scientific diagrams (RG4/RG4BP biology, docking pipeline, ANKH pipeline) + the scripts that generate them |
| `02_ankh_full_dataset_pipeline/` | The full-QuadRAtlas-dataset ANKH validation script — ready to run, needs an internet-connected environment (see its `README.md`) |
| `03_deliverable_documents/` | The finished slide deck and Word summary document, ready to submit or present, plus their generator scripts |
| `docs/PROJECT_LOG.md` | Narrative history: what was done, in order, tying every folder together |

Start with `docs/PROJECT_LOG.md` for the full story, or jump straight to
`03_deliverable_documents/` for the two finished deliverables.

## Environment setup

Two ways to get set up, pick one:

### Option A — one command (recommended)

```bash
chmod +x setup.sh   # if it isn't already
./setup.sh
```

Creates a Python virtual environment (`.venv`) with everything needed for
the diagrams and (on a machine with internet) the ANKH pipeline, and
installs the Node packages needed to regenerate the deck/doc.

### Option B — manual

```bash
# Python (venv)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# — or, if you use conda instead —
conda env create -f environment.yml
conda activate kshv-g4-discovery

# Node (only needed to regenerate the docx/pptx from their generator scripts)
npm install
```

## What needs internet, what doesn't

| Process | Needs internet? |
|---|---|
| Regenerating the 3 diagrams (`01_diagrams/`) | No |
| Regenerating the docx/pptx (`03_deliverable_documents/generators/`) | No |
| Running the full ANKH-vs-QuadRAtlas pipeline (`02_ankh_full_dataset_pipeline/`) | **Yes** — QuadRAtlas, UniProt, and HuggingFace (model weights). See that folder's README for a manual data-export step and a Google Colab walkthrough |

## Quick start

```bash
./setup.sh
source .venv/bin/activate

# Regenerate the diagrams
cd 01_diagrams && python scripts/make_rg4_diagram.py && python scripts/make_process_diagrams.py && cd ..

# View the finished deliverables — no setup needed, they're already built
open 03_deliverable_documents/Genomic_Search_Project_Slides.pptx
open 03_deliverable_documents/Genomic_Search_Summary_and_Corrections.docx

# Run the full-dataset ANKH validation (needs internet — see its README first)
cd 02_ankh_full_dataset_pipeline && cat README.md
```

## Status

Everything through the 6-candidate mismatch and the professor's two
corrections (cosine similarity range; QuadRAtlas ≠ ANKH measurement type)
is complete and reflected in `03_deliverable_documents/`. The full-dataset
validation (`02_ankh_full_dataset_pipeline/`) is written and ready to run
but has not yet been executed — it needs to run in an internet-connected
environment (Colab or similar), not in the sandbox this project was
assembled in. See `docs/PROJECT_LOG.md` section 6-7 for the full context.
