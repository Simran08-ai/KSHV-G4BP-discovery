#!/usr/bin/env python3
"""
Extract every table from a QuadRAtlas PostgreSQL dump (a plain-text .sql
file produced by pg_dump) into per-table CSV files — with NO PostgreSQL
server required.

WHY THIS EXISTS
----------------
QuadRAtlas (https://rg4db.cibio.unitn.it/download) does not offer a plain
CSV export. Its "Download the database" option is the only way to get the
underlying RG4 scores, and what you get is a full PostgreSQL dump script
(a .sql file full of CREATE TABLE and COPY ... FROM stdin statements) —
not a CSV. Rather than making you install and run an actual PostgreSQL
server just to get the data back out, this script reads the dump's own
COPY blocks directly. That's the exact same tab-separated data a real
`psql` restore would load into a database — this just reads it straight
from the text file instead.

HOW TO USE
-----------
1. Go to https://rg4db.cibio.unitn.it/download, and under "Download the
   database" (the whole-DB PostgreSQL script — NOT the smaller
   "RG4-binding proteins" card, which doesn't include per-RG4
   normalized/percentile scores), click Download.
2. Save the file as data/quadratlas_dump.sql (relative to this script).
   It may be large (potentially several hundred MB to a few GB) since it
   includes genome-wide ENCODE eCLIP binding-site data — that's normal,
   let it fully download.
3. Run:
       python parse_pg_dump.py
4. Read the summary it prints (also saved to
   data/tables/_schema_summary.txt) — every table's name, row count, and
   column names.
5. Open build_gene_table.py, fill in its CONFIG section with the real
   table/column names from that summary, and run it. That writes
   data/quadratlas_export.csv, which is exactly what
   run_ankh_full_quadratlas.py expects.

This script only extracts tables — it deliberately does not guess which
table holds RG4 scores vs. gene annotations, since that depends on
QuadRAtlas's actual schema, which isn't knowable without the real dump in
hand. If you run this and send the printed summary back, the CONFIG in
build_gene_table.py can be filled in exactly rather than guessed.
"""

import os
import re
import csv
import sys

DUMP_PATH = "data/quadratlas_dump.sql"
OUTPUT_DIR = "data/tables"

# Matches: COPY public.some_table (col1, col2, "col 3") FROM stdin;
COPY_RE = re.compile(r'^COPY\s+([\w".]+)\s*\(([^)]*)\)\s+FROM\s+stdin;\s*$')


def unescape_pg_text(value):
    """Undo COPY text-format escaping: \\N = NULL, plus \\t \\n \\r \\\\."""
    if value == "\\N":
        return ""
    return (
        value.replace("\\t", "\t")
        .replace("\\n", "\n")
        .replace("\\r", "\r")
        .replace("\\\\", "\\")
    )


def clean_table_name(raw):
    # "public.foo" -> "foo"; strip any quoting
    return raw.split(".")[-1].strip('"')


def extract(dump_path, output_dir):
    if not os.path.exists(dump_path):
        print(f"ERROR: {dump_path} not found.")
        print("See the docstring at the top of this script for how to get it.")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)
    summary = []
    current_table = None
    current_cols = []
    writer = None
    f_out = None
    row_count = 0

    with open(dump_path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            if current_table is None:
                m = COPY_RE.match(line.strip())
                if m:
                    current_table = clean_table_name(m.group(1))
                    current_cols = [c.strip().strip('"') for c in m.group(2).split(",")]
                    row_count = 0
                    out_path = os.path.join(output_dir, f"{current_table}.csv")
                    f_out = open(out_path, "w", newline="", encoding="utf-8")
                    writer = csv.writer(f_out)
                    writer.writerow(current_cols)
                    print(f"Extracting table '{current_table}' ({len(current_cols)} columns) -> {out_path}")
            else:
                if line.rstrip("\n") == "\\.":
                    f_out.close()
                    summary.append((current_table, current_cols, row_count))
                    print(f"  done: {row_count} rows")
                    current_table, current_cols, writer, f_out = None, [], None, None
                    continue
                fields = [unescape_pg_text(v) for v in line.rstrip("\n").split("\t")]
                writer.writerow(fields)
                row_count += 1

    if not summary:
        print("\nNo COPY blocks found. This usually means the file isn't a plain-text")
        print("pg_dump SQL script (e.g. it might be a custom-format .dump/.backup file,")
        print("which needs `pg_restore`, not a text parser like this one). Check the")
        print("file you downloaded and re-export as a plain SQL script if needed.")
        sys.exit(1)

    summary_path = os.path.join(output_dir, "_schema_summary.txt")
    with open(summary_path, "w") as sf:
        sf.write("QuadRAtlas dump -- extracted tables\n")
        sf.write("=" * 50 + "\n\n")
        for table, cols, n in summary:
            sf.write(f"TABLE: {table}  ({n} rows)\n")
            sf.write("  columns: " + ", ".join(cols) + "\n\n")

    print(f"\n{len(summary)} tables extracted. Summary written to {summary_path}")
    print("Open that file (or scroll up) and find:")
    print("  - the table with RG4 scores (look for columns like normalized_score, percentile, ...)")
    print("  - the table mapping RG4s/transcripts to gene symbols (gene_id, gene_symbol, gene_name, ...)")
    print("Then fill in build_gene_table.py's CONFIG section to match, and run it.")


if __name__ == "__main__":
    extract(DUMP_PATH, OUTPUT_DIR)
