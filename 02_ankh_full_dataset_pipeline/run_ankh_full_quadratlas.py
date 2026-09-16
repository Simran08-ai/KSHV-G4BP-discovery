#!/usr/bin/env python3
"""
Run ANKH against the ENTIRE QuadRAtlas dataset and check whether ANKH's
similarity-to-nucleolin score actually tracks QuadRAtlas's experimental
RG4 evidence — across every gene, not just the six hand-picked candidates
(NFATC4, DMKN, CHD4, EIF4G1, MOGS, PTPA) used earlier.

WHY THIS EXISTS
----------------
The earlier analysis (DMKN mismatch) was based on 6 cherry-picked, already
high-confidence candidates. Your professor's point: that's not enough to
know if ANKH's scoring is broadly right or wrong — you need to run it
against the whole dataset and look at the correlation, not one anecdote.

WHERE TO RUN THIS
------------------
This script needs real internet access to QuadRAtlas, UniProt, and
HuggingFace (to download the ANKH model weights, ~1.5 GB). It will NOT run
in a network-sandboxed environment. Recommended: Google Colab (free, has
a GPU, already has most of this preinstalled) — https://colab.research.google.com
Just create a new notebook, paste this file's contents into a cell (or
upload it and `!python run_ankh_full_quadratlas.py`), and follow the
one manual step below.

THE ONE MANUAL STEP (can't be automated from here)
-----------------------------------------------------
QuadRAtlas (https://rg4db.cibio.unitn.it) is a JavaScript web app with a
"Download" section but no documented public bulk-download API endpoint
that could be hard-coded here. So:
  1. Go to https://rg4db.cibio.unitn.it in a browser, find the Download /
     Data page, and export the full RG4 regions table (or the whole
     database dump) as CSV.
  2. Save it as `quadratlas_export.csv` next to this script.
  3. If your column names differ from what's guessed below, adjust
     GENE_COL / NORM_SCORE_COL / PERCENTILE_COL in the CONFIG section —
     the script will print the columns it finds if something doesn't match,
     so you're not guessing blind.

WHAT THIS SCRIPT ACTUALLY DOES
--------------------------------
1. Loads the QuadRAtlas export, aggregates from RG4-region-level to one
   row per gene (mean normalized score, mean percentile score, region
   count) — explicitly, in code, so the aggregation logic is no longer
   a described-but-unverified assumption.
2. Fetches one canonical protein sequence per gene from UniProt (human,
   reviewed/Swiss-Prot preferred).
3. Loads ANKH (Ankh-Base) and embeds nucleolin (NCL) plus every candidate
   gene's sequence.
4. Computes cosine similarity of every gene to nucleolin.
5. Merges QuadRAtlas scores with ANKH similarity, computes Pearson and
   Spearman correlation across the WHOLE dataset, flags outliers (like
   DMKN) by how far they sit from the overall trend, and saves a results
   table + scatter plot.

OUTPUTS
-------
- ankh_quadratlas_full_results.csv   (gene, quadratlas scores, ankh similarity, outlier flag)
- ankh_vs_quadratlas_scatter.png     (the whole-dataset comparison plot)
- printed summary: correlation coefficients, top outliers, whether DMKN-style
  mismatches are common or rare across the full dataset
"""

import os
import re
import time
import json
import sys

# ============================================================ CONFIG ======
# Paths below assume you run this script from inside
# 02_ankh_full_dataset_pipeline/ (i.e. the submission folder structure is
# intact). If you paste this into a flat Colab cell instead, either create
# data/ and results/ subfolders first, or just change these three paths.
QUADRATLAS_CSV = "data/quadratlas_export.csv"   # <- the file you export manually, see docstring
GENE_COL_CANDIDATES = ["gene", "gene_symbol", "gene_name", "symbol", "Gene"]
NORM_SCORE_COL_CANDIDATES = ["normalized_score", "normalizedscore", "norm_score", "NormalizedScore"]
PERCENTILE_COL_CANDIDATES = ["percentile", "percentile_score", "percentilescore", "Percentile"]

REFERENCE_PROTEIN = "NCL"          # nucleolin — same reference used throughout the project
REFERENCE_UNIPROT_ID = "P19338"    # human nucleolin, verified UniProt accession

OUTPUT_CSV = "results/ankh_quadratlas_full_results.csv"
OUTPUT_PLOT = "results/ankh_vs_quadratlas_scatter.png"
SEQUENCE_CACHE = "results/uniprot_sequence_cache.json"   # so re-runs don't re-hit UniProt for genes already fetched
EMBEDDING_CACHE = "results/ankh_embedding_cache.json"    # so re-runs don't re-embed genes already processed

BATCH_SIZE = 8            # sequences per ANKH batch — lower if you hit GPU memory errors
UNIPROT_RATE_LIMIT_S = 0.34   # ~3 requests/sec, polite default


# ============================================================ STEP 0: deps
def ensure_dependencies():
    """Install what's missing. Safe to re-run."""
    import importlib
    pkgs = {
        "pandas": "pandas",
        "numpy": "numpy",
        "requests": "requests",
        "torch": "torch",
        "transformers": "transformers",
        "sklearn": "scikit-learn",
        "scipy": "scipy",
        "matplotlib": "matplotlib",
        "tqdm": "tqdm",
    }
    missing = []
    for mod, pip_name in pkgs.items():
        try:
            importlib.import_module(mod)
        except ImportError:
            missing.append(pip_name)
    if missing:
        print(f"Installing missing packages: {missing}")
        os.system(f"{sys.executable} -m pip install -q {' '.join(missing)}")


# ============================================================ STEP 1: load QuadRAtlas, aggregate per gene
def load_quadratlas_gene_table(csv_path):
    import pandas as pd

    if not os.path.exists(csv_path):
        raise FileNotFoundError(
            f"\n\n'{csv_path}' not found. This is the one manual step — export it from "
            f"https://rg4db.cibio.unitn.it (Download page) and place it next to this script. "
            f"See the docstring at the top of this file for details.\n"
        )

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df):,} rows from {csv_path}. Columns found: {list(df.columns)}")

    def pick_col(candidates, df):
        for c in candidates:
            if c in df.columns:
                return c
        # case-insensitive fallback
        lower_map = {c.lower(): c for c in df.columns}
        for c in candidates:
            if c.lower() in lower_map:
                return lower_map[c.lower()]
        return None

    gene_col = pick_col(GENE_COL_CANDIDATES, df)
    norm_col = pick_col(NORM_SCORE_COL_CANDIDATES, df)
    pct_col = pick_col(PERCENTILE_COL_CANDIDATES, df)

    if not gene_col or not norm_col or not pct_col:
        raise ValueError(
            f"Couldn't auto-match columns. Found gene_col={gene_col}, norm_col={norm_col}, "
            f"pct_col={pct_col}. Your file's actual columns are: {list(df.columns)}\n"
            f"Edit GENE_COL_CANDIDATES / NORM_SCORE_COL_CANDIDATES / PERCENTILE_COL_CANDIDATES "
            f"at the top of this script to match, then re-run."
        )

    # Explicit, visible aggregation logic — one gene can host many RG4 regions,
    # so we average per gene and also keep the region count for transparency.
    gene_table = (
        df.groupby(gene_col)
        .agg(
            normalized_score=(norm_col, "mean"),
            percentile_score=(pct_col, "mean"),
            rg4_region_count=(norm_col, "count"),
        )
        .reset_index()
        .rename(columns={gene_col: "gene"})
    )
    gene_table["gene"] = gene_table["gene"].astype(str).str.strip().str.upper()
    gene_table = gene_table.drop_duplicates(subset="gene")
    print(f"Aggregated to {len(gene_table):,} unique genes.")
    return gene_table


# ============================================================ STEP 2: fetch sequences from UniProt
def fetch_sequences(genes, cache_path=SEQUENCE_CACHE):
    import requests
    from tqdm import tqdm

    cache = {}
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            cache = json.load(f)

    to_fetch = [g for g in genes if g not in cache]
    print(f"{len(genes) - len(to_fetch)} sequences already cached, fetching {len(to_fetch)} more.")

    session = requests.Session()
    for gene in tqdm(to_fetch, desc="UniProt fetch"):
        url = (
            "https://rest.uniprot.org/uniprotkb/search"
            f"?query=gene:{gene}+AND+organism_id:9606+AND+reviewed:true"
            "&fields=sequence&format=fasta&size=1"
        )
        try:
            resp = session.get(url, timeout=15)
            resp.raise_for_text = resp.text
            fasta = resp.text
            if fasta.startswith(">"):
                seq = "".join(fasta.split("\n")[1:]).strip()
                cache[gene] = seq if seq else None
            else:
                cache[gene] = None
        except Exception as e:
            print(f"  ! {gene}: {e}")
            cache[gene] = None
        time.sleep(UNIPROT_RATE_LIMIT_S)

        # checkpoint every 50 so a crash doesn't lose progress
        if len(cache) % 50 == 0:
            with open(cache_path, "w") as f:
                json.dump(cache, f)

    with open(cache_path, "w") as f:
        json.dump(cache, f)

    found = {g: s for g, s in cache.items() if g in genes and s}
    print(f"Sequences found for {len(found)}/{len(genes)} genes.")
    return found


# ============================================================ STEP 3: ANKH embeddings
def load_ankh():
    """Loads Ankh-Base via the official `ankh` package if available, else falls
    back to raw HuggingFace transformers with the same checkpoint."""
    import torch
    try:
        import ankh
        model, tokenizer = ankh.load_base_model()
        model.eval()
        return model, tokenizer, torch, "ankh_pkg"
    except ImportError:
        from transformers import T5Tokenizer, T5EncoderModel
        tokenizer = T5Tokenizer.from_pretrained("ElnaggarLab/ankh-base", do_lower_case=False)
        model = T5EncoderModel.from_pretrained("ElnaggarLab/ankh-base")
        model.eval()
        return model, tokenizer, torch, "hf_fallback"


def embed_sequences(gene_seqs, cache_path=EMBEDDING_CACHE):
    import numpy as np
    import torch

    cache = {}
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            raw = json.load(f)
            cache = {k: np.array(v) for k, v in raw.items()}

    to_embed = {g: s for g, s in gene_seqs.items() if g not in cache}
    if not to_embed:
        print("All embeddings already cached.")
        return cache

    print(f"Embedding {len(to_embed)} sequences with ANKH (this is the slow step)...")
    model, tokenizer, torch, source = load_ankh()
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    print(f"Using ANKH via {source} on {device}.")

    genes = list(to_embed.keys())
    for i in range(0, len(genes), BATCH_SIZE):
        batch_genes = genes[i:i + BATCH_SIZE]
        # Ankh expects amino acids as space-separated tokens
        batch_seqs = [list(to_embed[g][:1022]) for g in batch_genes]  # truncate extreme outliers
        ids = tokenizer.batch_encode_plus(
            batch_seqs, add_special_tokens=True, padding=True,
            is_split_into_words=True, return_tensors="pt",
        )
        ids = {k: v.to(device) for k, v in ids.items()}
        with torch.no_grad():
            out = model(**ids)
        # mean-pool over real tokens (respecting the attention mask)
        hidden = out.last_hidden_state
        mask = ids["attention_mask"].unsqueeze(-1)
        pooled = (hidden * mask).sum(1) / mask.sum(1)
        pooled = pooled.cpu().numpy()

        for g, vec in zip(batch_genes, pooled):
            cache[g] = vec

        if (i // BATCH_SIZE) % 10 == 0:
            with open(cache_path, "w") as f:
                json.dump({k: v.tolist() for k, v in cache.items()}, f)
            print(f"  {min(i + BATCH_SIZE, len(genes))}/{len(genes)} embedded...")

    with open(cache_path, "w") as f:
        json.dump({k: v.tolist() for k, v in cache.items()}, f)

    return cache


# ============================================================ STEP 4-6: similarity, merge, analyze
def cosine_sim(a, b):
    import numpy as np
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def analyze(gene_table, embeddings, reference_gene=REFERENCE_PROTEIN):
    import pandas as pd
    import numpy as np
    from scipy.stats import pearsonr, spearmanr
    import matplotlib.pyplot as plt

    if reference_gene not in embeddings:
        raise ValueError(f"Reference protein {reference_gene} has no embedding — check it was fetched/embedded.")
    ref_vec = embeddings[reference_gene]

    rows = []
    for _, row in gene_table.iterrows():
        gene = row["gene"]
        if gene not in embeddings or gene == reference_gene:
            continue
        sim = cosine_sim(embeddings[gene], ref_vec)
        rows.append({
            "gene": gene,
            "normalized_score": row["normalized_score"],
            "percentile_score": row["percentile_score"],
            "rg4_region_count": row["rg4_region_count"],
            "ankh_similarity_to_nucleolin": sim,
        })

    results = pd.DataFrame(rows).sort_values("percentile_score", ascending=False).reset_index(drop=True)

    # correlation across the WHOLE dataset — this is the actual answer to
    # "is ANKH's scoring right or not," not a six-protein anecdote
    pear_r, pear_p = pearsonr(results["percentile_score"], results["ankh_similarity_to_nucleolin"])
    spear_r, spear_p = spearmanr(results["percentile_score"], results["ankh_similarity_to_nucleolin"])

    # flag outliers: fit a simple linear trend, then flag genes whose
    # ANKH similarity is far below what the trend predicts for their
    # QuadRAtlas score (DMKN-style mismatches)
    coeffs = np.polyfit(results["percentile_score"], results["ankh_similarity_to_nucleolin"], 1)
    predicted = np.polyval(coeffs, results["percentile_score"])
    residual = results["ankh_similarity_to_nucleolin"] - predicted
    results["residual_from_trend"] = residual
    results["is_outlier_like_dmkn"] = residual < (residual.mean() - 2 * residual.std())

    results.to_csv(OUTPUT_CSV, index=False)

    plt.figure(figsize=(10, 7))
    plt.scatter(results["percentile_score"], results["ankh_similarity_to_nucleolin"],
                s=14, alpha=0.5, color="#4472C4", label="all genes")
    outliers = results[results["is_outlier_like_dmkn"]]
    plt.scatter(outliers["percentile_score"], outliers["ankh_similarity_to_nucleolin"],
                s=30, color="#B23B3B", label="outliers (DMKN-like mismatch)")
    xs = np.linspace(results["percentile_score"].min(), results["percentile_score"].max(), 50)
    plt.plot(xs, np.polyval(coeffs, xs), color="black", linewidth=1, linestyle="--", label="trend")
    plt.xlabel("QuadRAtlas evidence (percentile score)")
    plt.ylabel("ANKH similarity to nucleolin")
    plt.title(f"ANKH vs QuadRAtlas across all {len(results):,} genes\nPearson r={pear_r:.3f} (p={pear_p:.2e}), Spearman r={spear_r:.3f}")
    plt.legend()
    plt.tight_layout()
    plt.savefig(OUTPUT_PLOT, dpi=150)

    print("\n" + "=" * 70)
    print(f"RESULTS — {len(results):,} genes compared")
    print("=" * 70)
    print(f"Pearson correlation:  r = {pear_r:.3f}  (p = {pear_p:.2e})")
    print(f"Spearman correlation: r = {spear_r:.3f}  (p = {spear_p:.2e})")
    print(f"Outliers flagged (DMKN-like mismatches): {outliers.shape[0]} of {len(results)} "
          f"({100*outliers.shape[0]/len(results):.1f}%)")
    if "DMKN" in results["gene"].values:
        dmkn_row = results[results["gene"] == "DMKN"].iloc[0]
        print(f"\nDMKN specifically: percentile={dmkn_row['percentile_score']:.1f}, "
              f"ANKH similarity={dmkn_row['ankh_similarity_to_nucleolin']:.3f}, "
              f"outlier={'YES' if dmkn_row['is_outlier_like_dmkn'] else 'no'}")
    print(f"\nFull results saved to: {OUTPUT_CSV}")
    print(f"Scatter plot saved to: {OUTPUT_PLOT}")
    print("\nHow to read this: a Pearson/Spearman r close to 0 means ANKH's similarity")
    print("score does NOT track QuadRAtlas's experimental evidence across the dataset —")
    print("DMKN wouldn't be a fluke, it'd be representative of a broader disconnect. A")
    print("moderate-to-strong positive r with a handful of clear outliers (DMKN included)")
    print("would mean ANKH is broadly right, with specific, identifiable exceptions worth")
    print("investigating individually — a very different conclusion, and a much stronger")
    print("one than six examples can support either way.")
    return results


# ============================================================ MAIN
def main():
    ensure_dependencies()

    # make sure data/ and results/ exist even if this script was copied
    # somewhere flatter than the original submission folder structure
    os.makedirs(os.path.dirname(QUADRATLAS_CSV) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(OUTPUT_CSV) or ".", exist_ok=True)

    gene_table = load_quadratlas_gene_table(QUADRATLAS_CSV)

    # make sure the reference protein is in the fetch list even if it
    # wasn't a QuadRAtlas hit itself
    genes = sorted(set(gene_table["gene"]) | {REFERENCE_PROTEIN})
    seqs = fetch_sequences(genes)

    # guarantee we have nucleolin specifically, falling back to its known
    # UniProt accession directly if the gene-symbol search missed it
    if REFERENCE_PROTEIN not in seqs:
        import requests
        r = requests.get(f"https://rest.uniprot.org/uniprotkb/{REFERENCE_UNIPROT_ID}.fasta", timeout=15)
        if r.text.startswith(">"):
            seqs[REFERENCE_PROTEIN] = "".join(r.text.split("\n")[1:]).strip()

    embeddings = embed_sequences(seqs)
    analyze(gene_table, embeddings)


if __name__ == "__main__":
    main()
