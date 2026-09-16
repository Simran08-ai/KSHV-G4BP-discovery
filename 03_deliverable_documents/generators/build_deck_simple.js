const pptxgen = require("pptxgenjs");

const FONT = "Calibri";
const TEXT = "000000";
const MUTED = "444444";
const LINE = "BFBFBF";
const TABLE_HDR = "4472C4";

const W = 10, H = 7.5; // standard 4:3-ish plain layout like the original deck
const MX = 0.6;
const CW = W - MX*2;

const pres = new pptxgen();
pres.layout = "LAYOUT_4x3";

function header(slide, text){
  slide.addText(text, { x: MX, y: 0.35, w: CW, h: 0.6, fontFace: FONT, fontSize: 24, bold: true, color: TEXT });
}

function bullets(slide, items, opts={}){
  slide.addText(items.map((t,i)=>({ text: t, options: { bullet: true, breakLine: i<items.length-1 } })), {
    x: opts.x ?? MX, y: opts.y ?? 1.15, w: opts.w ?? CW, h: opts.h ?? 4.5,
    fontFace: FONT, fontSize: opts.size ?? 16, color: TEXT, lineSpacingMultiple: 1.25, paraSpaceAfter: 8,
  });
}

function subLabel(slide, label, text, y){
  slide.addText([
    { text: label + "  ", options: { bold: true } },
    { text: text, options: { bold: false } },
  ], { x: MX, y, w: CW, h: 0.9, fontFace: FONT, fontSize: 14.5, color: TEXT, lineSpacingMultiple: 1.25 });
}

// plain box-and-arrow flow, left to right
function flowHorizontal(slide, labels, opts={}){
  const n = labels.length;
  const boxW = opts.boxW ?? 1.55, boxH = opts.boxH ?? 0.75;
  const totalW = opts.w ?? CW;
  const gap = (totalW - n*boxW) / (n-1);
  const y = opts.y ?? 2.0;
  let x = opts.x ?? MX;
  labels.forEach((t, i) => {
    slide.addShape("rect", { x, y, w: boxW, h: boxH, fill: { color: "FFFFFF" }, line: { color: TEXT, width: 1 } });
    slide.addText(t, { x, y, w: boxW, h: boxH, align: "center", valign: "middle", fontFace: FONT, fontSize: opts.fontSize ?? 11.5, bold: !!opts.bold, color: TEXT });
    if (i < n-1){
      slide.addShape("line", { x: x+boxW, y: y+boxH/2, w: gap, h: 0, line: { color: TEXT, width: 1.25, endArrowType: "triangle" } });
    }
    x += boxW + gap;
  });
}

// plain box-and-arrow flow, top to bottom
function flowVertical(slide, labels, opts={}){
  const boxW = opts.boxW ?? 3.0, boxH = opts.boxH ?? 0.65;
  const gap = opts.gap ?? 0.45;
  const x = opts.x ?? MX;
  let y = opts.y ?? 1.6;
  labels.forEach((t, i) => {
    slide.addShape("rect", { x, y, w: boxW, h: boxH, fill: { color: "FFFFFF" }, line: { color: TEXT, width: 1 } });
    slide.addText(t, { x, y, w: boxW, h: boxH, align: "center", valign: "middle", fontFace: FONT, fontSize: opts.fontSize ?? 12.5, color: TEXT });
    if (i < labels.length-1){
      slide.addShape("line", { x: x+boxW/2, y: y+boxH, w: 0, h: gap, line: { color: TEXT, width: 1.25, endArrowType: "triangle" } });
    }
    y += boxH + gap;
  });
}

// ============================================================ SLIDE 1 — TITLE
{
  const s = pres.addSlide();
  s.addText("Genomic Search Project", {
    x: 0.5, y: 2.5, w: W-1, h: 0.9, align: "center", fontFace: FONT, fontSize: 32, bold: true, color: TEXT,
  });
  s.addText("Project Walkthrough: What I've Done So Far", {
    x: 0.5, y: 3.3, w: W-1, h: 0.5, align: "center", fontFace: FONT, fontSize: 18, color: TEXT,
  });
  s.addText("Presentation by Simran Chauhan", {
    x: 0.5, y: 4.3, w: W-1, h: 0.4, align: "center", fontFace: FONT, fontSize: 15, color: TEXT,
  });
  s.addText("Masters in Health Informatics", {
    x: 0.5, y: 4.65, w: W-1, h: 0.4, align: "center", fontFace: FONT, fontSize: 15, color: TEXT,
  });
}

// ============================================================ SLIDE 2 — THE PROBLEM
{
  const s = pres.addSlide();
  header(s, "Where I Started");
  bullets(s, [
    "KSHV is a virus linked to Kaposi's Sarcoma.",
    "It relies on G-quadruplexes (G4s) — a knot-like shape DNA/RNA can fold into — to stay latent in cells and reactivate later.",
    "Proteins that bind these structures (G4-binding proteins, or G4BPs) attach to G4s and help control what the virus does next.",
    "Going in, there wasn't a systematic way to find G4 sites and the proteins that bind them across different conditions.",
  ], { w: 5.6, h: 3.9 });

  flowVertical(s, ["KSHV virus", "G4 structures form", "G4BPs bind and\ncontrol activity"], { x: 6.5, y: 1.55, boxW: 3.0, boxH: 0.75, gap: 0.4 });
  s.addText("How the pieces connect", { x: 6.5, y: 1.15, w: 3.0, h: 0.35, fontFace: FONT, fontSize: 11.5, italic: true, color: MUTED, align: "center" });

  s.addText("Goal: build a computational pipeline that could find these G4–G4BP pairs, using KSHV as the case study.", {
    x: MX, y: 5.75, w: CW, h: 0.8, fontFace: FONT, fontSize: 15, italic: true, color: TEXT, lineSpacingMultiple: 1.25,
  });
}

// ============================================================ SLIDE 2B — THE BIOLOGY (RG4 / RG4BP DIAGRAM)
{
  const s = pres.addSlide();
  header(s, "The Biology: RG4 and RG4BP");
  s.addText("A closer look at the two molecules from the last slide — the RNA G-quadruplex (RG4) structure itself, and how an RG4-binding protein (RG4BP) recognizes it on a KSHV transcript.", {
    x: MX, y: 1.0, w: CW, h: 0.7, fontFace: FONT, fontSize: 12.5, color: TEXT, lineSpacingMultiple: 1.2,
  });
  const imgH = 4.6, imgW = imgH * (3300/2160);
  s.addImage({ path: "/tmp/report/rg4_rg4bp_diagram.png", x: MX + (CW-imgW)/2, y: 1.8, w: imgW, h: imgH });
  s.addText("G-tetrad structure and rG4 sequence motif per established G-quadruplex biology; RG4BP binding domain shown as a generic arginine-rich (RGG-type) motif, consistent with known rG4-binding proteins such as nucleolin and FMRP.", {
    x: MX, y: 6.55, w: CW, h: 0.55, fontFace: FONT, fontSize: 9.5, italic: true, color: MUTED,
  });
}

// ============================================================ SLIDE 3 — ROADMAP
{
  const s = pres.addSlide();
  header(s, "How the Project Unfolded");
  s.addText("Roughly week by week, from May 2025 to April 2026, the project moved through six stages. Each one is covered in more detail on the slides that follow.", {
    x: MX, y: 1.05, w: CW, h: 0.75, fontFace: FONT, fontSize: 14, color: TEXT, lineSpacingMultiple: 1.3,
  });

  flowHorizontal(s, ["1. Collect\ndata", "2. Build 3D\nmodels", "3. Dock", "4. Automate\npipeline", "5. Check vs\nKSHV", "6. AI-based\nsearch"], {
    x: MX, y: 2.4, w: CW, boxW: 1.35, boxH: 1.0, fontSize: 11,
  });

  bullets(s, [
    "Stages 1–4 were spent building and de-bugging the pipeline on a known test pair (AS1411/nucleolin).",
    "Stage 5 brought KSHV proteins back in to test the pipeline on the real target.",
    "Stage 6 scaled the search up using AI, which is where the current open question comes from.",
  ], { y: 4.1, h: 2.3, size: 14.5 });
}

// ============================================================ SLIDE 4 — STAGE 1
{
  const s = pres.addSlide();
  header(s, "Stage 1: Collecting the Data");
  bullets(s, [
    "Pulled data from public databases of G-quadruplexes, G4-binding proteins, and aptamers.",
    "Tools/data sources: AptaDB, QUADRatlas, UniProt, NCBI, SQL.",
    "Most of it arrived unstructured — cleaned it up with SQL queries and by hand.",
  ], { h: 2.3 });
  subLabel(s, "Blocker:", "QUADRatlas had zero KSHV-specific data — every record (over 1M rows) came from two unrelated cell lines, K562 and HepG2.", 3.6);
  subLabel(s, "What I did:", "Switched to a well-characterized model pair — AS1411 and nucleolin, a known aptamer–protein binding pair — to build and test the pipeline first, with the plan to bring KSHV proteins back in once the method was working.", 4.55);
}

// ============================================================ SLIDE 5 — STAGE 2-3
{
  const s = pres.addSlide();
  header(s, "Stages 2–3: Building 3D Models, Then Docking");
  bullets(s, [
    "A sequence is just letters until it's built into a 3D shape — binding depends on shape.",
    "Built AS1411's 3D structure and pulled nucleolin structures from the Protein Data Bank.",
    "Docking (HADDOCK) predicts how two structures fit together and scores the fit — more negative is better.",
    "Tools: 3D-NuS, PDB, AlphaFold, HADDOCK, AutoDock Vina, PyMOL, Chimera.",
  ], { h: 2.6 });
  subLabel(s, "Blocker:", "First HADDOCK submission was rejected (a zinc ion with no charge specified). PyMOL was also stuck in an unlicensed mode and wouldn't render structures.", 3.85);
  subLabel(s, "What I did:", "Used AutoDock Vina in the meantime (works offline, no license needed). After fixing the file, HADDOCK gave a much stronger result: about −101, compared to +272 initially.", 4.75);
}

// ============================================================ SLIDE 6 — STAGE 4
{
  const s = pres.addSlide();
  header(s, "Stage 4: Automating the Pipeline");
  bullets(s, [
    "Up to this point every step ran by hand — clean the file, dock it, make a figure, repeat.",
    "Set it up as a Snakemake pipeline instead, so each step only re-runs when something it depends on actually changes.",
  ], { h: 1.3 });

  s.addText("The pipeline, as four connected steps:", { x: MX, y: 2.55, w: CW, h: 0.35, fontFace: FONT, fontSize: 13.5, bold: true, color: TEXT });
  flowHorizontal(s, ["Clean\n(PyMOL)", "Dock\n(HADDOCK)", "Analyze\n(parse scores)", "Visualize\n(PyMOL)"], {
    x: MX, y: 3.0, w: CW, boxW: 1.9, boxH: 0.85, fontSize: 12,
  });

  bullets(s, [
    "This is what let the project scale up — from testing one protein at a time to cleaning and docking 2,640 candidate nucleolin structures in a single automated run.",
  ], { y: 4.45, h: 1.2, size: 14.5 });
}

// ============================================================ SLIDE 7 — STAGE 5
{
  const s = pres.addSlide();
  header(s, "Stage 5: Does AS1411 Compete With KSHV?");
  bullets(s, [
    "Brought the KSHV viral proteins (ORF57, ORF20, LANA) back into the analysis.",
    "Compared exactly which residues on nucleolin each one contacts.",
  ], { h: 1.5 });

  const headerOpts = { bold: true, color: "FFFFFF", fill: { color: TABLE_HDR }, valign: "middle" };
  const bodyOpts = { color: TEXT, valign: "middle" };
  const rows = [
    [{ text: "Pair", options: headerOpts }, { text: "Shared contact residues", options: headerOpts }],
    [{ text: "AS1411 vs ORF57", options: bodyOpts }, { text: "1.67%", options: bodyOpts }],
    [{ text: "AS1411 vs ORF20", options: bodyOpts }, { text: "0%", options: bodyOpts }],
    [{ text: "AS1411 vs LANA", options: bodyOpts }, { text: "0%", options: bodyOpts }],
    [{ text: "ORF20 vs LANA", options: bodyOpts }, { text: "60%", options: bodyOpts }],
  ];
  s.addTable(rows, {
    x: MX, y: 2.9, w: 5.0, colW: [3.0, 2.0],
    fontFace: FONT, fontSize: 13.5, border: { type: "solid", color: LINE, pt: 0.75 },
    fill: { color: "FFFFFF" },
    rowH: 0.4,
  });

  subLabel(s, "Result:", "AS1411 and the KSHV proteins share almost no contact residues — they bind different sites on nucleolin. So AS1411 doesn't work by blocking the same spot the virus uses.", 5.4);
}

// ============================================================ SLIDE 8 — STAGE 6
{
  const s = pres.addSlide();
  header(s, "Stage 6: Using AI to Search for New Candidates");
  bullets(s, [
    "Docking one pair at a time doesn't scale to searching the whole human proteome for new candidates.",
    "Used ANKH instead, a protein language model trained on huge numbers of protein sequences.",
  ], { h: 1.3 });

  s.addText("How it works:", { x: MX, y: 2.5, w: CW, h: 0.35, fontFace: FONT, fontSize: 13.5, bold: true, color: TEXT });
  flowHorizontal(s, ["Protein\nsequence", "ANKH\nmodel", "Numeric\nembedding", "Compare to\nnucleolin", "Similarity\nscore"], {
    x: MX, y: 2.95, w: CW, boxW: 1.55, boxH: 0.85, fontSize: 10.5,
  });

  subLabel(s, "Result:", "On proteins already known to bind G4s (Nucleophosmin 0.87, HNRNPA1 0.84, FUS 0.65, TDP-43 0.52), the similarity scores matched what was already established biologically — a reasonable sign the model was picking up something real.", 4.15);
}

// ============================================================ SLIDE 8B — DOCKING PROCESS IN DETAIL
{
  const s = pres.addSlide();
  header(s, "Process 1 in Detail: Structural Docking");
  s.addText("A closer, more technical look at how AS1411 and nucleolin were actually docked together — the process behind Stages 2–5.", {
    x: MX, y: 1.0, w: CW, h: 0.4, fontFace: FONT, fontSize: 12.5, color: TEXT,
  });
  const imgH2 = 4.9, imgW2 = imgH2 * (3300/2160);
  s.addImage({ path: "/tmp/report/docking_pipeline_diagram.png", x: MX + (CW-imgW2)/2, y: 1.5, w: imgW2, h: imgH2 });
  s.addText("HADDOCK stages and score composition per standard information-driven docking methodology; AutoDock Vina used as an independent, license-free cross-check.", {
    x: MX, y: 6.55, w: CW, h: 0.55, fontFace: FONT, fontSize: 9.5, italic: true, color: MUTED,
  });
}

// ============================================================ SLIDE 8C — ANKH PROCESS IN DETAIL
{
  const s = pres.addSlide();
  header(s, "Process 2 in Detail: The ANKH Pipeline");
  s.addText("A closer, more technical look at how ANKH turns a protein sequence into a similarity score — the process behind Stage 6.", {
    x: MX, y: 1.0, w: CW, h: 0.4, fontFace: FONT, fontSize: 12.5, color: TEXT,
  });
  const imgH3 = 4.9, imgW3 = imgH3 * (3300/2160);
  s.addImage({ path: "/tmp/report/ankh_pipeline_diagram.png", x: MX + (CW-imgW3)/2, y: 1.5, w: imgW3, h: imgH3 });
  s.addText("Ankh is an encoder–decoder transformer protein language model, self-supervised on large protein sequence databases; embeddings are compared by cosine similarity (mathematically −1 to 1; observed 0–1 for these embeddings).", {
    x: MX, y: 6.55, w: CW, h: 0.55, fontFace: FONT, fontSize: 9.5, italic: true, color: MUTED,
  });
}

// ============================================================ SLIDE 8D — CONCLUSIONS OF BOTH PROCESSES
{
  const s = pres.addSlide();
  header(s, "Conclusions: What Each Process Told Us");

  s.addText("Process 1 — Structural Docking", { x: MX, y: 1.05, w: CW, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: TEXT });
  bullets(s, [
    "AS1411 binds nucleolin with a strong, favorable score (about −101 after fixing the input file) — the pipeline itself works correctly.",
    "But AS1411's contact residues barely overlap with where the KSHV proteins (ORF57, ORF20, LANA) bind nucleolin — so AS1411 does not compete for the same site the virus uses.",
  ], { y: 1.45, h: 1.9, size: 13 });

  s.addText("Process 2 — ANKH Similarity Search", { x: MX, y: 3.5, w: CW, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: TEXT });
  bullets(s, [
    "ANKH correctly ranked known G4-binding proteins in a biologically sensible order, which is a good sign the model captures something real.",
    "But it missed DMKN — high experimental RG4 evidence, low ANKH similarity — because the model compares whole-protein similarity, not the one short region that actually drives G4 binding.",
  ], { y: 3.9, h: 1.9, size: 13 });

  s.addText("Together: the docking process ruled out one hypothesis (AS1411 site competition); the ANKH process opened a new one (DMKN) that still needs to be checked — which is exactly where the project stands now.", {
    x: MX, y: 5.95, w: CW, h: 1.0, fontFace: FONT, fontSize: 13.5, italic: true, color: TEXT, lineSpacingMultiple: 1.3,
  });
}

// ============================================================ SLIDE 8E — CORRECTING THE COMPARISON
{
  const s = pres.addSlide();
  header(s, "Correcting the Comparison: Two Different Kinds of Score");
  bullets(s, [
    "QuadRAtlas already provides two scores per RG4 region — a normalized score and a percentile score — both measuring how strongly that region is associated with RG4 formation. Since one protein binds many RG4 regions, we averaged these per protein to rank biological importance.",
    "ANKH's score is a different kind of measurement: cosine similarity between two embedding vectors. Mathematically, cosine similarity ranges from −1 to 1 — for ANKH's protein embeddings specifically, the values we observed happened to land between 0 and 1.",
  ], { y: 1.1, h: 2.5, size: 14 });

  const headerOpts = { bold: true, color: "FFFFFF", fill: { color: TABLE_HDR }, valign: "middle" };
  const bodyOpts = { color: TEXT, valign: "middle" };
  const rows = [
    [{ text: "", options: headerOpts }, { text: "QuadRAtlas", options: headerOpts }, { text: "ANKH", options: headerOpts }],
    [{ text: "Measures", options: bodyOpts }, { text: "biological RG4 association", options: bodyOpts }, { text: "structural / sequence similarity", options: bodyOpts }],
    [{ text: "Score", options: bodyOpts }, { text: "normalized + percentile (already in the dataset)", options: bodyOpts }, { text: "cosine similarity (computed by us)", options: bodyOpts }],
    [{ text: "Range", options: bodyOpts }, { text: "percentile: 0–100", options: bodyOpts }, { text: "−1 to 1 (math); 0–1 (observed)", options: bodyOpts }],
  ];
  s.addTable(rows, {
    x: MX, y: 3.75, w: CW, colW: [1.8, 3.5, 3.5],
    fontFace: FONT, fontSize: 12, border: { type: "solid", color: LINE, pt: 0.75 },
    fill: { color: "FFFFFF" }, rowH: 0.5,
  });

  subLabel(s, "Bottom line:", "QuadRAtlas measures biological evidence that a protein binds RG4s. ANKH measures how structurally similar a protein looks to nucleolin. They're not the same scale — a “mismatch” means “biologically important but not structurally similar,” not that two versions of the same number disagree.", 6.15);
}

// ============================================================ SLIDE 9 — THE MISMATCH
{
  const s = pres.addSlide();
  header(s, "Where Things Stand: A Mismatch Turned Up");
  s.addText("Checked ANKH's rankings against QuadRAtlas's actual experimental binding data — real lab measurements of which proteins bind G4s. For most candidates the two roughly agreed. For DMKN, they went in opposite directions, which is the open question the project is on right now.", {
    x: MX, y: 1.0, w: CW, h: 0.8, fontFace: FONT, fontSize: 13.5, color: TEXT, lineSpacingMultiple: 1.25,
  });

  const cats = ["NFATC4","DMKN","CHD4","EIF4G1","MOGS","PTPA"];
  const quad = [75,63,63,55,57,68];
  const ankh = [64,35,72,77,59,51];
  s.addChart(pres.charts.BAR, [
    { name: "QuadRAtlas evidence (percentile)", labels: cats, values: quad },
    { name: "ANKH similarity (×100)", labels: cats, values: ankh },
  ], {
    x: MX, y: 1.85, w: CW, h: 4.0,
    barDir: "col",
    showTitle: false,
    showLegend: true,
    legendPos: "b",
    legendFontFace: FONT,
    legendFontSize: 11,
    showValue: true,
    dataLabelPosition: "outEnd",
    dataLabelFontSize: 10,
    catAxisLabelFontFace: FONT,
    catAxisLabelFontSize: 11,
    valAxisHidden: true,
    catGridLine: { style: "none" },
    valGridLine: { style: "none" },
  });

  s.addText("Both bars are rescaled to 0–100 just to compare rank order side by side — they're still two different kinds of measurement (see previous slide), not the same score on the same scale.", {
    x: MX, y: 5.95, w: CW, h: 0.5, fontFace: FONT, fontSize: 10, italic: true, color: MUTED, lineSpacingMultiple: 1.2,
  });
}

// ============================================================ SLIDE 10 — WHAT THIS MEANS
{
  const s = pres.addSlide();
  header(s, "What This Likely Means");
  bullets(s, [
    "ANKH's embedding describes the whole protein at once.",
    "G4 binding is usually driven by one short, arginine-rich region — not the protein's overall character.",
    "A protein can carry that region and still look “different” from nucleolin overall — which may be why DMKN was missed.",
    "In practice: ANKH tracked known G4-binders well (Nucleophosmin, HNRNPA1, FUS, TDP-43) — proteins it effectively already \"knew.\" It broke down on DMKN, a genuinely new candidate — which is exactly the generalization gap that matters for search.",
  ], { h: 3.0 });
  s.addText("From my own notes on this:", { x: MX, y: 4.3, w: CW, h: 0.35, fontFace: FONT, fontSize: 13.5, bold: true, color: TEXT });
  s.addText("“High RG4 score (QuadRAtlas) ≠ high similarity (ANKH). Example: DMKN — biologically important, but low similarity. ANKH learns general protein similarity; it does not capture RG4-specific biological interactions.”", {
    x: MX, y: 4.7, w: CW, h: 1.3, fontFace: FONT, fontSize: 13.5, italic: true, color: TEXT, lineSpacingMultiple: 1.25,
  });
}

// ============================================================ SLIDE 11 — NEXT STEPS
{
  const s = pres.addSlide();
  header(s, "What We're Going to Do Next");
  s.addText("Decision: ANKH works, but only on proteins it effectively already knew — not on new candidates. So we're improving it. Three steps, cheapest and fastest first, lab work last:", {
    x: MX, y: 1.0, w: CW, h: 0.55, fontFace: FONT, fontSize: 13, italic: true, color: MUTED, lineSpacingMultiple: 1.2,
  });

  flowHorizontal(s, ["1. Check DMKN\nmore closely", "2. Improve ANKH:\ntask-specific model", "3. Validate DMKN\nin the lab"], {
    x: MX, y: 1.75, w: CW, boxW: 2.7, boxH: 0.85, fontSize: 12, bold: true,
  });

  bullets(s, [
    "Check DMKN more closely (quick): confirm how the embedding is pooled — averaging over the whole protein could be hiding the one region that matters — and check the QuadRAtlas data quality behind DMKN's count.",
    "Improve ANKH with a task-specific model: instead of comparing every candidate to one protein, train a model directly on known binders and non-binders, using QuadRAtlas scores as labels, so it learns what G4 binding actually looks like rather than general similarity. Reviewed ANKH, ProtTrans, and ESM as background — all general-purpose protein language models; none trained specifically on RG4 association, which is the gap this step fills.",
    "Validate DMKN in the lab: run the pulldown assay / Western blot already set up for Aim 3 — this is the only way to know for sure whether DMKN is a real discovery or a data issue.",
  ], { y: 3.0, h: 4.2, size: 12.5 });
}

// ============================================================ SLIDE 11B — THE STORY: HOW IT STARTED
{
  const s = pres.addSlide();
  header(s, "The Whole Story, Simply: How It Started");
  bullets(s, [
    "KSHV is a virus that causes Kaposi's Sarcoma.",
    "To hide inside cells and reactivate later, it relies on knot-shaped structures called G-quadruplexes (G4s), and on proteins that grab onto them (G4-binding proteins, or G4BPs).",
    "Nobody had a systematic way to find which G4s and which G4BPs actually work together — especially for KSHV specifically.",
    "The goal: build a computational pipeline that could find these G4–G4BP pairs, using KSHV as the test case.",
  ], { y: 1.1, h: 4.5, size: 16 });
}

// ============================================================ SLIDE 11C — THE STORY: WHAT WE DID
{
  const s = pres.addSlide();
  header(s, "The Whole Story, Simply: What We Did");

  s.addText("Part 1 — Docking (does the shape fit?)", { x: MX, y: 1.05, w: CW, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: TEXT });
  bullets(s, [
    "Built and tested the whole pipeline on a well-known pair first — AS1411 and nucleolin — since real KSHV data was too thin to start with.",
    "Docked the 3D structures, then brought the real KSHV proteins (ORF57, ORF20, LANA) back in to check: does AS1411 block the same spot the virus uses? Answer: no — barely any overlap.",
  ], { y: 1.4, h: 1.9, size: 13.5 });

  s.addText("Part 2 — AI search (does it look similar?)", { x: MX, y: 3.45, w: CW, h: 0.35, fontFace: FONT, fontSize: 15, bold: true, color: TEXT });
  bullets(s, [
    "Docking one pair at a time doesn't scale to the whole human proteome, so we used ANKH, an AI model that turns a protein into a numerical fingerprint and compares it to nucleolin's.",
    "On proteins already known to bind G4s, this worked well — the ranking matched established biology.",
  ], { y: 3.8, h: 1.9, size: 13.5 });
}

// ============================================================ SLIDE 11D — THE STORY: HOW IT ENDED
{
  const s = pres.addSlide();
  header(s, "The Whole Story, Simply: How It Ended (So Far)");
  bullets(s, [
    "Separately, we pulled real candidate proteins straight from QuadRAtlas's experimental data — proteins that show up repeatedly and strongly at G4 sites.",
    "DMKN had the strongest experimental signal of the group — but ANKH ranked it dead last for similarity to nucleolin. That's the mismatch.",
    "Why it's a fair comparison: QuadRAtlas measures biological evidence; ANKH measures structural similarity to one reference protein — two different rulers, not the same number twice.",
    "Likely reason: G4 binding usually comes from one short region of a protein, not its overall character — so a protein can carry that region and still look “different” from nucleolin overall.",
  ], { y: 1.1, h: 3.6, size: 14 });

  s.addText("Where we landed: ANKH works well on proteins it already effectively knew, but not reliably on new ones — so we're building a task-specific model trained directly on QuadRAtlas's own scores next.", {
    x: MX, y: 5.05, w: CW, h: 1.0, fontFace: FONT, fontSize: 14, italic: true, color: TEXT, lineSpacingMultiple: 1.3,
  });
}

// ============================================================ SLIDE 12 — THANK YOU
{
  const s = pres.addSlide();
  s.addText("Thank You", {
    x: 0.5, y: 3.2, w: W-1, h: 0.8, align: "center", fontFace: FONT, fontSize: 30, bold: true, color: TEXT,
  });
  s.addText("Simran Chauhan  ·  Masters in Health Informatics", {
    x: 0.5, y: 4.05, w: W-1, h: 0.4, align: "center", fontFace: FONT, fontSize: 14, color: TEXT,
  });
}

pres.writeFile({ fileName: "/tmp/report/Genomic_Search_Project_Slides_Simple.pptx" }).then(() => console.log("done"));
