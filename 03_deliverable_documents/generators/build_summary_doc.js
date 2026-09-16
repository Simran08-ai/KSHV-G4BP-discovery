const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, BorderStyle, Numbering, LevelFormat,
} = require("docx");

const FONT = "Calibri";
const NAVY = "1F2937";
const MUTED = "555555";
const ACCENT = "2E5395";
const LIGHT_FILL = "F2F2F2";
const RED = "B23B3B";
const GREEN = "2E7D32";

const PAGE = { width: 12240, height: 15840 }; // US Letter

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
    children: [new TextRun({ text, bold: true, size: 30, color: NAVY, font: FONT })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 260, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: ACCENT, font: FONT })],
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    children: [new TextRun({ text, font: FONT, size: 22, color: NAVY, italics: !!opts.italic, bold: !!opts.bold })],
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: "main-bullets", level: 0 },
    spacing: { after: 100, line: 290 },
    children: [
      opts.lead
        ? new TextRun({ text: opts.lead, bold: true, font: FONT, size: 21, color: NAVY })
        : new TextRun({ text: "", font: FONT, size: 21 }),
      new TextRun({ text: opts.lead ? " " + text : text, font: FONT, size: 21, color: NAVY }),
    ],
  });
}

function calloutBox(label, text, color) {
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [9350],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: color || ACCENT },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: color || ACCENT },
      left: { style: BorderStyle.SINGLE, size: 4, color: color || ACCENT },
      right: { style: BorderStyle.SINGLE, size: 4, color: color || ACCENT },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9350, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: LIGHT_FILL, color: "auto" },
            margins: { top: 160, bottom: 160, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: label, bold: true, font: FONT, size: 22, color: color || ACCENT })],
              }),
              new Paragraph({
                spacing: { after: 0, line: 300 },
                children: [new TextRun({ text, font: FONT, size: 21, color: NAVY })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function spacer(h = 120) {
  return new Paragraph({ spacing: { after: h }, children: [] });
}

function makeTable(header, rows, colW) {
  const totalW = colW.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map((t, i) => new TableCell({
      width: { size: colW[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ACCENT, color: "auto" },
      margins: { top: 100, bottom: 100, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF", font: FONT, size: 20 })] })],
    })),
  });
  const bodyRows = rows.map((row, ri) => new TableRow({
    children: row.map((cellText, ci) => new TableCell({
      width: { size: colW[ci], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? "FFFFFF" : "F7F7F7", color: "auto" },
      margins: { top: 90, bottom: 90, left: 120, right: 120 },
      children: [new Paragraph({ children: [new TextRun({ text: String(cellText), font: FONT, size: 20, color: NAVY })] })],
    })),
  }));
  return new Table({
    width: { size: totalW, type: WidthType.DXA },
    columnWidths: colW,
    rows: [headerRow, ...bodyRows],
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "main-bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 420, hanging: 260 } } } },
        ],
      },
    ],
  },
  sections: [
    {
      properties: { page: { size: PAGE, margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: [

        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun({ text: "Genomic Search Project", bold: true, size: 40, color: NAVY, font: FONT })],
        }),
        new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: "AI-Driven G4–G4BP Discovery in KSHV — Project Summary & Model Correction Notes", size: 24, color: ACCENT, font: FONT })],
        }),
        new Paragraph({
          spacing: { after: 400 },
          children: [new TextRun({ text: "Simran Chauhan · Masters in Health Informatics", size: 20, color: MUTED, italics: true, font: FONT })],
        }),

        // ============================================================ SECTION 1
        h1("1. Where This Started"),
        p("KSHV (Kaposi's Sarcoma-associated Herpesvirus) causes Kaposi's Sarcoma. To stay latent inside cells and reactivate later, it relies on G-quadruplexes (G4s) — knot-shaped structures that guanine-rich DNA/RNA can fold into — and on the proteins that bind them, called G4-binding proteins (G4BPs)."),
        p("Going into this project, there wasn't a systematic way to identify which G4s and which G4BPs actually work together, especially in a KSHV-specific context. The goal was to build a computational pipeline capable of finding these G4–G4BP pairs, using KSHV as the test case."),

        // ============================================================ SECTION 2
        h1("2. What We Did"),

        h2("2.1  Process 1 — Structural Docking (AS1411 ↔ Nucleolin)"),
        p("Because real KSHV-specific data in QuadRAtlas was too sparse to start with (every record came from two unrelated cell lines, K562 and HepG2), the pipeline was first built and validated on a well-characterized model pair: the aptamer AS1411 and the protein nucleolin."),
        bullet("built 3D structures for AS1411 and pulled nucleolin structures from the Protein Data Bank;", { lead: "Structures:" }),
        bullet("docked using HADDOCK (information-driven, restraint-based docking), with AutoDock Vina used as an offline stand-in when HADDOCK's server rejected an early submission over an unspecified zinc-ion charge;", { lead: "Docking:" }),
        bullet("the HADDOCK score went from +272.3 (broken input) to about −101 after the file was fixed — more negative scores indicate a more favorable, stable complex;", { lead: "Result:" }),
        bullet("the whole pipeline was automated with Snakemake, scaling from testing one protein at a time to cleaning and docking 2,640 candidate structures in a single run.", { lead: "Automation:" }),
        spacer(60),
        p("With the pipeline validated, the real KSHV viral proteins (ORF57, ORF20, LANA) were brought back in to answer a key question: does AS1411 block nucleolin at the same site the virus uses?"),
        makeTable(
          ["Pair", "Shared contact residues"],
          [["AS1411 vs ORF57", "1.67%"], ["AS1411 vs ORF20", "0%"], ["AS1411 vs LANA", "0%"], ["ORF20 vs LANA", "60%"]],
          [5500, 3850],
        ),
        spacer(140),
        p("AS1411 and the KSHV proteins share almost no contact residues on nucleolin — they bind different sites. So AS1411 does not work by blocking the exact spot the virus uses; whatever antiviral effect it has comes through some other mechanism."),

        h2("2.2  Process 2 — The ANKH Similarity-Search Pipeline"),
        p("Docking one candidate pair at a time doesn't scale to searching the whole human proteome, so the project switched to ANKH, a protein language model, to search computationally instead."),
        bullet("a protein's amino-acid sequence is fed into ANKH, an encoder–decoder transformer self-supervised on large protein sequence databases;", { lead: "How it works:" }),
        bullet("ANKH produces per-residue vectors that are pooled into one fixed-length embedding per protein;", { lead: "Embedding:" }),
        bullet("a candidate's embedding is compared to nucleolin's embedding using cosine similarity, cosθ = (A·B) / (|A||B|) — mathematically this ranges from −1 to 1; for these particular protein embeddings, the observed values landed between 0 and 1;", { lead: "Comparison:" }),
        bullet("on proteins already known to bind G4s, the similarity ranking matched established biology well: Nucleolin (1.00, reference), Nucleophosmin (0.87), HNRNPA1 (0.84), FUS (0.65), TDP-43 (0.52).", { lead: "Validation:" }),

        h2("2.3  How the QuadRAtlas Candidates Were Actually Found"),
        p("QuadRAtlas's raw data is enormous — over a million RG4 region records — so candidates were narrowed down computationally before ANKH was ever run on them. This happened two separate ways, which were later cross-checked against each other."),
        bullet("running ANKH's embedding search directly, independent of QuadRAtlas, turned up ANKRD11 as the top-ranked candidate (cosine similarity 0.724 to nucleolin) — flagged at the time with the caveat that this is based on similarity alone and doesn't confirm actual biological RG4 association.", { lead: "Approach 1 — pure ANKH search:" }),
        bullet("filtering RG4 regions directly in QuadRAtlas by binding count (> 1,000), average log2FC (≈ 5.3–5.6), and an acceptable p-value, then mapping each surviving region to its transcript and gene and counting how often each gene appeared among the high-confidence regions, identified TOM1 as the most repeated gene (RG4 binding count of 115 — comparable to established RG4-binders PRMT1 [161], FUBP1 [145], G3BP2 [111]).", { lead: "Approach 2 — QuadRAtlas data-driven search:" }),
        p("Cross-checking the two approaches is where the mismatch pattern first appeared — before DMKN made it impossible to ignore. TOM1's ANKH similarity to nucleolin came out to only 0.56, already noticeably lower than established RG4-binders like Nucleophosmin (0.87) or HNRNPA1 (0.84). RTCA, another QuadRAtlas-derived candidate, showed the same pattern (0.41–0.65 similarity despite strong experimental RG4 evidence). The same repeated-gene method was then broadened from one gene (TOM1) to the six-candidate table below, where DMKN turned this from “a couple of odd cases” into the clearest, most extreme example."),
        p("Two terms worth being precise about, since they come up throughout: the normalized score is a scaled measure of RG4 strength at a given region (higher = stronger RG4 signal); the percentile score is where that region ranks against every other RG4 region in the dataset (e.g., 75th percentile = stronger than 75% of all regions). Both were already present in QuadRAtlas — averaging them up to one value per gene, since a single gene can host many RG4 regions, is a reasonable reading of the methodology but hasn't been independently re-verified line-by-line against the original SQL, and is worth double-checking against your own scripts before citing it as exact."),

        // ============================================================ SECTION 3
        h1("3. How It Ended (So Far) — The Mismatch"),
        p("Using this same repeated-gene approach, broadened well beyond TOM1 alone, six candidates emerged as the clearest, most repeated, highest-confidence hits: NFATC4, DMKN, CHD4, EIF4G1, MOGS, and PTPA. Each already carries a normalized score and a percentile score in the dataset, reflecting how strongly it's associated with RG4 formation."),
        p("ANKH's similarity-to-nucleolin score was then computed for each of these same six candidates and compared against the QuadRAtlas evidence:"),
        makeTable(
          ["Protein", "QuadRAtlas evidence (percentile)", "ANKH similarity"],
          [["NFATC4", "75", "0.64"], ["DMKN", "63", "0.35"], ["CHD4", "63", "0.72"], ["EIF4G1", "55", "0.77"], ["MOGS", "57", "0.59"], ["PTPA", "68", "0.51"]],
          [3000, 3400, 2950],
        ),
        spacer(140),
        p("For most candidates the two roughly agreed. DMKN did not: it had the strongest experimental RG4 signal of the group (RG4 count 1038, the highest of the six), yet ANKH ranked it lowest for similarity to nucleolin. This is the open discrepancy the project is currently working through."),

        // ============================================================ SECTION 4
        h1("4. Correcting the Comparison — Feedback Incorporated"),
        p("Two points of feedback sharpened how this mismatch should be understood and described:"),

        calloutBox(
          "Correction 1 — Cosine similarity's range",
          "Cosine similarity is mathematically defined between −1 and 1 (the cosine of the angle between two vectors). Saying it “ranges from 0 to 1” is not the correct general definition. What was actually observed is that, in practice, ANKH's protein embeddings for this project happened to produce similarity values between 0 and 1 — that's a property of this specific model and this specific set of proteins, not a property of cosine similarity itself.",
          ACCENT,
        ),
        spacer(160),
        calloutBox(
          "Correction 2 — QuadRAtlas and ANKH measure different things",
          "QuadRAtlas does not produce a “similarity score.” It provides a normalized score and a percentile score per RG4 region, both measuring how strongly that region is associated with RG4 formation — biological evidence, already present in the dataset. ANKH's cosine similarity measures something else entirely: how structurally/sequence-similar a candidate protein is to one reference protein (nucleolin). These are two different kinds of measurement, not two versions of the same number — so a “mismatch” means “biologically important, but not structurally similar to nucleolin,” not that two scores disagree on the same scale.",
          ACCENT,
        ),
        spacer(160),
        p("With that correction in place, the conclusion still holds, but is now stated precisely: DMKN shows strong biological evidence of RG4 association (QuadRAtlas) while looking structurally unlike nucleolin to ANKH — and that gap is the actual finding, not a contradiction between comparable numbers."),

        // ============================================================ SECTION 5
        h1("5. What This Likely Means"),
        bullet("ANKH's embedding describes a protein's overall character, not one specific region of it.", {}),
        bullet("G4 binding is usually driven by one short, arginine-rich region — not a protein's overall similarity to another protein.", {}),
        bullet("A protein can carry that region and still look “different” from nucleolin overall — which is the likely reason DMKN was missed.", {}),
        bullet("In practice, ANKH tracked already-known G4-binders well (proteins it had effectively already “seen” patterns for), but broke down on DMKN, a genuinely new candidate. That's the real generalization gap: it matters for search precisely because the whole point of Process 2 was finding new candidates, not re-confirming known ones.", {}),

        // ============================================================ SECTION 6
        h1("6. Future Work"),
        p("The DMKN mismatch was found using only six hand-picked, high-confidence candidates out of QuadRAtlas's full dataset — not nearly enough to know whether it's a real, general pattern or a one-off. Based on that, and on discussion with our professor, future work has two parts:"),

        h2("6.1  Future Work 1 — Run ANKH Against the Entire QuadRAtlas Dataset"),
        p("Rather than testing a small, pre-filtered set of candidates, the next step is to run the same ANKH similarity-to-nucleolin comparison across every protein in QuadRAtlas, not just the six that passed a strict high-confidence filter. This removes the selection bias of only having looked at proteins we already suspected were interesting, and turns “DMKN disagreed” into a statistically meaningful result one way or the other."),
        bullet("pull every unique gene associated with an RG4 region from QuadRAtlas, along with its existing normalized score and percentile score — no filtering this time, the full set.", { lead: "Step 1 — Pull the full gene list:" }),
        bullet("retrieve a protein sequence for every one of those genes (UniProt batch ID mapping, reusing the lookup approach from Stage 1).", { lead: "Step 2 — Get sequences:" }),
        bullet("run every sequence through ANKH and compute cosine similarity to nucleolin for each one, the same computation already done for six proteins, just looped over the whole list.", { lead: "Step 3 — Batch-run ANKH:" }),
        bullet("join the QuadRAtlas score and the ANKH similarity score for every protein into one table, then plot ANKH similarity against QuadRAtlas score across the whole set and look at the correlation. If DMKN is a genuine outlier among an otherwise-consistent trend, that's a strong finding; if ANKH is broadly disconnected from QuadRAtlas across the board, that's a different — and equally important — finding.", { lead: "Step 4 — Compare at scale:" }),
        spacer(60),
        p("This full labeled table (QuadRAtlas score + ANKH similarity, for every protein) is also exactly the training data needed for Future Work 2 below — so this step isn't just a sanity check, it directly feeds the next one."),

        h2("6.2  Future Work 2 — Improve ANKH With a Task-Specific Model"),
        p("Instead of comparing every candidate to one reference protein (nucleolin) and hoping general similarity lines up with RG4 binding, train a model directly on known binders and non-binders, using QuadRAtlas's own scores as labels — so it learns what G4 binding actually looks like, rather than borrowing a general notion of protein similarity."),
        bullet("the full protein list, sequences, and QuadRAtlas scores gathered in Future Work 1.", { lead: "Training data:" }),
        bullet("ANKH, ProtTrans, and ESM were reviewed as background — all are general-purpose protein language models; none is trained specifically on RG4 association, which is the gap a task-specific model would fill.", { lead: "Literature reviewed:" }),
        bullet("predict RG4 association directly from a protein's sequence, using ANKH and/or ESM as the underlying sequence representation, fine-tuned or re-trained on QuadRAtlas labels rather than used off-the-shelf.", { lead: "Goal:" }),
        bullet("run the pulldown assay / Western blot already set up for Aim 3 on DMKN specifically — the only way to know for certain whether DMKN is a real discovery or a data-quality issue, and a useful check on whichever model (old or new) is right about it.", { lead: "Lab validation:" }),

        spacer(200),
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 8 } },
          spacing: { before: 100 },
          children: [new TextRun({ text: "Genomic Search Project — Simran Chauhan, Masters in Health Informatics", italics: true, size: 18, color: MUTED, font: FONT })],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  require("fs").writeFileSync("/tmp/report/Genomic_Search_Summary_and_Corrections.docx", buf);
  console.log("done");
});
