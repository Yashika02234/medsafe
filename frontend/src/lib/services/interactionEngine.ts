import { prisma } from "@/lib/prisma";
import { getInteractionLabelText } from "@/lib/clients/openfda";
import { getDrugClasses, CLASS_LABEL_TERMS, type DrugClass } from "@/lib/data/drugClasses";
import type { InteractionSeverity, InteractionWarning } from "@/types/interaction";

// Matches the deployed DB constraint/comment on interactions_cache.severity_ordinal:
// 1=severe, 2=moderate, 3=mild, 99=unknown — ORDER BY severity_ordinal ASC surfaces severe first.
const SEVERITY_ORDINAL: Record<InteractionSeverity, number> = {
  severe: 1,
  moderate: 2,
  mild: 3,
  unknown: 99,
};

// Validated keyword set — see .claude/outputs/phase-00/interaction-validation-report.md.
// Single significant terms rather than fixed bigrams: real FDA label text varies in word
// order ("closely monitor" vs "monitor closely") and rarely uses the report's exact phrasing.
const SEVERE_KEYWORDS = [
  "contraindicat",
  "avoid concomitant",
  "serious",
  "fatal",
  "risk of death",
  "life-threatening",
  "bleeding",
  "hemorrhage",
  "serotonin syndrome",
  "respiratory depression",
  "coma",
];
const MODERATE_KEYWORDS = ["monitor", "additive effect", "can increase"];

function classifySeverity(windowText: string): InteractionSeverity {
  const t = windowText.toLowerCase();
  if (SEVERE_KEYWORDS.some((k) => t.includes(k))) return "severe";
  if (MODERATE_KEYWORDS.some((k) => t.includes(k))) return "moderate";
  return "mild";
}

// ± 300 chars of context around a mention, per the validated spec.
function findMentionWindow(text: string, mention: string): string | null {
  const idx = text.toLowerCase().indexOf(mention.toLowerCase());
  if (idx === -1) return null;
  const start = Math.max(0, idx - 300);
  const end = Math.min(text.length, idx + mention.length + 300);
  return text.slice(start, end);
}

// Try the other drug's exact name first; if absent, fall back to its drug-class terms
// (e.g. a label saying "SSRIs" instead of naming "sertraline" specifically).
// Fixes misses #1/#2 from the Phase 0 validation report.
function findMentionWindowForDrug(text: string, otherDrug: DrugIngredient): string | null {
  const direct = findMentionWindow(text, otherDrug.saltName);
  if (direct) return direct;

  for (const cls of getDrugClasses(otherDrug.saltName)) {
    for (const term of CLASS_LABEL_TERMS[cls]) {
      const window = findMentionWindow(text, term);
      if (window) return window;
    }
  }
  return null;
}

// Mechanism-based interactions that FDA label text mining structurally can't catch —
// neither drug's label names the other. Fixes miss #3 (Losartan + Spironolactone) from
// the Phase 0 validation report. Checked before any OpenFDA call (cheaper, and correct
// regardless of label wording).
const CLASS_PAIR_RULES: Array<{
  classes: [DrugClass, DrugClass];
  severity: InteractionSeverity;
  description: string;
}> = [
  {
    classes: ["arb", "k_sparing_diuretic"],
    severity: "moderate",
    description:
      "Combining an angiotensin receptor blocker (ARB) with a potassium-sparing diuretic can increase the risk of hyperkalemia (elevated blood potassium). Periodic monitoring of potassium levels is recommended.",
  },
  {
    classes: ["ace_inhibitor", "k_sparing_diuretic"],
    severity: "moderate",
    description:
      "Combining an ACE inhibitor with a potassium-sparing diuretic can increase the risk of hyperkalemia (elevated blood potassium). Periodic monitoring of potassium levels is recommended.",
  },
];

function findClassPairRule(a: DrugIngredient, b: DrugIngredient) {
  const classesA = getDrugClasses(a.saltName);
  const classesB = getDrugClasses(b.saltName);
  for (const rule of CLASS_PAIR_RULES) {
    const [c1, c2] = rule.classes;
    if (
      (classesA.includes(c1) && classesB.includes(c2)) ||
      (classesA.includes(c2) && classesB.includes(c1))
    ) {
      return rule;
    }
  }
  return null;
}

interface DrugIngredient {
  rxcui: string;
  saltName: string;
}

function normalizeOrder(a: DrugIngredient, b: DrugIngredient): [DrugIngredient, DrugIngredient] {
  return a.rxcui < b.rxcui ? [a, b] : [b, a];
}

async function checkPair(
  x: DrugIngredient,
  y: DrugIngredient
): Promise<InteractionWarning | null> {
  const [drugA, drugB] = normalizeOrder(x, y);
  const rxcui_a = drugA.rxcui;
  const rxcui_b = drugB.rxcui;

  const cachedPair = await prisma.checked_pairs.findUnique({
    where: { rxcui_a_rxcui_b: { rxcui_a, rxcui_b } },
  });

  if (cachedPair && !cachedPair.needs_recheck) {
    if (!cachedPair.has_interactions) return null;
    const cached = await prisma.interactions_cache.findFirst({
      where: { rxcui_a, rxcui_b },
      orderBy: { severity_ordinal: "asc" },
    });
    if (!cached) return null;
    return {
      rxcui_a,
      rxcui_b,
      drug_a: drugA.saltName,
      drug_b: drugB.saltName,
      severity: cached.severity as InteractionSeverity,
      description: cached.description,
    };
  }

  const classRule = findClassPairRule(drugA, drugB);
  if (classRule) {
    await prisma.$transaction([
      prisma.interactions_cache.create({
        data: {
          rxcui_a,
          rxcui_b,
          severity: classRule.severity,
          severity_ordinal: SEVERITY_ORDINAL[classRule.severity],
          description: classRule.description,
          source: "class_rule",
        },
      }),
      prisma.checked_pairs.upsert({
        where: { rxcui_a_rxcui_b: { rxcui_a, rxcui_b } },
        create: { rxcui_a, rxcui_b, has_interactions: true },
        update: { has_interactions: true, needs_recheck: false, checked_at: new Date() },
      }),
    ]);
    return {
      rxcui_a,
      rxcui_b,
      drug_a: drugA.saltName,
      drug_b: drugB.saltName,
      severity: classRule.severity,
      description: classRule.description,
    };
  }

  const [textA, textB] = await Promise.all([
    getInteractionLabelText(drugA.saltName),
    getInteractionLabelText(drugB.saltName),
  ]);

  let window = textA ? findMentionWindowForDrug(textA, drugB) : null;
  if (!window && textB) window = findMentionWindowForDrug(textB, drugA);

  if (!window) {
    await prisma.checked_pairs.upsert({
      where: { rxcui_a_rxcui_b: { rxcui_a, rxcui_b } },
      create: { rxcui_a, rxcui_b, has_interactions: false },
      update: { has_interactions: false, needs_recheck: false, checked_at: new Date() },
    });
    return null;
  }

  const severity = classifySeverity(window);
  const description = window.trim();

  await prisma.$transaction([
    prisma.interactions_cache.create({
      data: {
        rxcui_a,
        rxcui_b,
        severity,
        severity_ordinal: SEVERITY_ORDINAL[severity],
        description,
        source: "openfda",
      },
    }),
    prisma.checked_pairs.upsert({
      where: { rxcui_a_rxcui_b: { rxcui_a, rxcui_b } },
      create: { rxcui_a, rxcui_b, has_interactions: true },
      update: { has_interactions: true, needs_recheck: false, checked_at: new Date() },
    }),
  ]);

  return { rxcui_a, rxcui_b, drug_a: drugA.saltName, drug_b: drugB.saltName, severity, description };
}

export async function checkAllInteractions(
  familyMemberId: string
): Promise<{ warnings: InteractionWarning[]; uncheckedCount: number }> {
  const medicines = await prisma.medicines.findMany({
    where: { family_member_id: familyMemberId, is_active: true },
    include: { ingredients: true },
  });

  const ingredients: DrugIngredient[] = [];
  let uncheckedCount = 0;
  for (const med of medicines) {
    for (const ing of med.ingredients) {
      if (ing.rxcui) ingredients.push({ rxcui: ing.rxcui, saltName: ing.salt_name });
      else uncheckedCount++;
    }
  }

  // Dedupe by rxcui — combo products can repeat a salt already tracked elsewhere.
  const uniqueByRxcui = new Map<string, DrugIngredient>();
  for (const ing of ingredients) uniqueByRxcui.set(ing.rxcui, ing);
  const unique = Array.from(uniqueByRxcui.values());

  const warnings: InteractionWarning[] = [];
  // Serial calls — avoids hammering OpenFDA, matches the validated approach.
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const result = await checkPair(unique[i], unique[j]);
      if (result) warnings.push(result);
    }
  }

  warnings.sort((a, b) => SEVERITY_ORDINAL[a.severity] - SEVERITY_ORDINAL[b.severity]);
  return { warnings, uncheckedCount };
}
