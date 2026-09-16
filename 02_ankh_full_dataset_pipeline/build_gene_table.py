#!/usr/bin/env python3
"""
Build data/quadratlas_export.csv (columns: gene, normalized_score,
percentile, rg4_region_count) from the per-table CSVs that
parse_pg_dump.py extracted.

This is written for the REAL QuadRAtlas schema (confirmed from an actual
dump's _schema_summary.txt — not a guess):

  rg4          (id_rg4, ..., normalizedscore, percentilescore, ...)
                 — the RG4 sites and their scores, but NOT linked to a
                   gene directly.
  rg4togene    (id_rg4togene, id_rg4, id_gene)
                 — bridge table: which gene(s) each RG4 belongs to.
  gene         (id_gene, ..., genename, ...)
                 — gene records; genename is the gene symbol.

So this is a two-hop join: rg4 -> rg4togene -> gene. One RG4 can map to
more than one gene (rg4togene has slightly more rows than rg4), which is
expected and handled by the join/groupby below — an RG4 mapped to two
genes contributes to both genes' aggregate scores.

DATA QUALITY NOTE
------------------
Some normalizedscore/percentilescore values aren't clean single numbers —
a handful of rows have several numbers jammed into one field (e.g.
'65%40%80%40%65%40%40%40%65%80%5%10%'), most likely several readings
across different techniques/cell lines that ended up concatenated instead
of split into separate rows. Rather than crash or silently drop those
rows, this script averages the numbers found inside a malformed field and
uses that as the value for that row, and prints how many rows this
affected so it's not a silent, invisible fix. Genuinely empty values are
treated as missing (excluded from the mean, not counted as 0).

RUN parse_pg_dump.py FIRST (this reads its output from data/tables/).
"""

import pandas as pd
import numpy as np
import re
import os

TABLES_DIR = "data/tables"
OUTPUT_CSV = "data/quadratlas_export.csv"

RG4_ID_COL = "id_rg4"
GENE_ID_COL = "id_gene"
NORM_SCORE_COL = "normalizedscore"
PERCENTILE_COL = "percentilescore"
GENE_NAME_COL = "genename"

NUMBER_RE = re.compile(r"-?\d+\.?\d*")


def clean_numeric(series, label):
    """Coerce a column to numeric, tolerating malformed multi-number
    fields by averaging the numbers found inside them. Returns the
    cleaned series; prints how many rows needed the fallback parse and
    how many ended up empty/unparseable (-> NaN, excluded from means)."""
    malformed = 0
    empty = 0

    def parse(v):
        nonlocal malformed, empty
        if pd.isna(v):
            empty += 1
            return np.nan
        s = str(v).strip().strip("'\"")
        if s == "":
            empty += 1
            return np.nan
        try:
            return float(s)
        except ValueError:
            nums = NUMBER_RE.findall(s)
            if not nums:
                empty += 1
                return np.nan
            malformed += 1
            return sum(float(n) for n in nums) / len(nums)

    cleaned = series.map(parse)
    if malformed or empty:
        print(f"  {label}: {malformed} rows had multiple jammed-together values (averaged), "
              f"{empty} rows were empty/unparseable (excluded from means)")
    return cleaned


def build():
    rg4 = pd.read_csv(os.path.join(TABLES_DIR, "rg4.csv"), low_memory=False)
    bridge = pd.read_csv(os.path.join(TABLES_DIR, "rg4togene.csv"), low_memory=False)
    genes = pd.read_csv(os.path.join(TABLES_DIR, "gene.csv"), low_memory=False)

    print(f"rg4: {len(rg4)} rows, rg4togene: {len(bridge)} rows, gene: {len(genes)} rows")

    print("Cleaning score columns...")
    rg4[NORM_SCORE_COL] = clean_numeric(rg4[NORM_SCORE_COL], NORM_SCORE_COL)
    rg4[PERCENTILE_COL] = clean_numeric(rg4[PERCENTILE_COL], PERCENTILE_COL)

    # rg4 -> rg4togene (attach a gene id to each RG4 row; an RG4 with
    # multiple genes produces one row per gene, which is what we want)
    step1 = rg4.merge(
        bridge[[RG4_ID_COL, GENE_ID_COL]],
        on=RG4_ID_COL,
        how="inner",
    )
    print(f"after joining rg4 -> rg4togene: {len(step1)} rows")

    # -> gene (attach the gene symbol)
    step2 = step1.merge(
        genes[[GENE_ID_COL, GENE_NAME_COL]],
        on=GENE_ID_COL,
        how="inner",
    )
    print(f"after joining -> gene: {len(step2)} rows, {step2[GENE_NAME_COL].nunique()} unique genes")

    # one row per gene: mean normalized score, mean percentile score,
    # and how many RG4 regions contributed to that gene's averages
    # (rg4_region_count counts non-null normalizedscore rows, same
    # convention used throughout this project)
    out = (
        step2.groupby(GENE_NAME_COL)
        .agg(
            normalized_score=(NORM_SCORE_COL, "mean"),
            percentile=(PERCENTILE_COL, "mean"),
            rg4_region_count=(NORM_SCORE_COL, "count"),
        )
        .reset_index()
        .rename(columns={GENE_NAME_COL: "gene"})
    )

    os.makedirs(os.path.dirname(OUTPUT_CSV) or ".", exist_ok=True)
    out.to_csv(OUTPUT_CSV, index=False)
    print(f"\nWrote {len(out)} genes to {OUTPUT_CSV}")
    print(out.head(10).to_string(index=False))
    return out


if __name__ == "__main__":
    build()
