# data/

Put your exported QuadRAtlas CSV here as:

    quadratlas_export.csv

Export it manually from https://rg4db.cibio.unitn.it's Download page (see
`../README.md` for why this one step can't be automated). The script
looks for a gene-symbol column, a normalized-score column, and a
percentile-score column, matching common name variants
(`gene`, `gene_symbol`, `Gene`, `GeneSymbol`, ... — see
`GENE_COL_CANDIDATES` / `NORM_SCORE_COL_CANDIDATES` /
`PERCENTILE_COL_CANDIDATES` near the top of `run_ankh_full_quadratlas.py`
if you need to add a variant).

This folder is otherwise empty on purpose — the CSV isn't included because
it must be exported fresh from QuadRAtlas under your own access.
