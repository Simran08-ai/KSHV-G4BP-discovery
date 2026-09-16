#!/usr/bin/env bash
# One-shot environment setup for the KSHV RG4 / RG4BP Discovery project.
#
# What this does:
#   1. Creates a Python virtual environment (.venv) and installs everything
#      needed to regenerate the diagrams (01_diagrams/) and, on a machine
#      with real internet access, run the full ANKH pipeline
#      (02_ankh_full_dataset_pipeline/).
#   2. Installs the Node packages needed to regenerate the Word doc and
#      slide deck from their generator scripts (03_deliverable_documents/generators/).
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
# Safe to re-run — it just re-installs into the same .venv / node_modules.

set -e

echo "=== 1/3: Python virtual environment ==="
if ! command -v python3 &> /dev/null; then
    echo "python3 not found. Install Python 3.10+ first (or use environment.yml with conda)."
    exit 1
fi

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "Python environment ready. Activate later with: source .venv/bin/activate"

echo ""
echo "=== 2/3: Node dependencies (for regenerating the docx / pptx) ==="
if command -v npm &> /dev/null; then
    npm install --no-save docx pptxgenjs
else
    echo "npm not found — skipping. You only need this if you plan to re-run the"
    echo "generator scripts in 03_deliverable_documents/generators/. The finished"
    echo ".docx and .pptx files are already included and don't need Node at all."
fi

echo ""
echo "=== 3/3: Sanity check ==="
python3 -c "import matplotlib, numpy; print('diagram deps OK')"
python3 - <<'PY'
import importlib
missing = [m for m in ("pandas", "torch", "transformers", "sklearn", "scipy") if importlib.util.find_spec(m) is None]
if missing:
    print("NOTE: not installed (only needed for the ANKH full-dataset run):", ", ".join(missing))
else:
    print("ANKH pipeline deps OK")
PY

echo ""
echo "Setup complete. See README.md for how to run each process."
