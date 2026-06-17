// Static drug-class table — covers exactly the classes needed to fix the 3 known
// class-based detection misses documented in .claude/outputs/phase-00/interaction-validation-report.md.
// Not pulled from RxClass API: these are well-established, uncontroversial pharmacology
// classifications for a small, fixed set of drugs — a static table avoids another
// external dependency/latency/failure mode for something this small.

export type DrugClass = "ssri" | "opioid" | "arb" | "ace_inhibitor" | "k_sparing_diuretic";

const CLASS_MEMBERS: Record<DrugClass, string[]> = {
  ssri: ["sertraline", "fluoxetine", "escitalopram", "paroxetine", "citalopram", "fluvoxamine"],
  opioid: ["tramadol", "codeine", "morphine", "oxycodone", "hydrocodone", "fentanyl", "tapentadol"],
  arb: ["losartan", "telmisartan", "olmesartan", "valsartan", "irbesartan", "candesartan"],
  ace_inhibitor: ["enalapril", "ramipril", "lisinopril", "captopril", "perindopril"],
  k_sparing_diuretic: ["spironolactone", "eplerenone", "amiloride", "triamterene"],
};

// Terms that might appear in FDA label text referring to a class generically,
// rather than naming a specific drug.
export const CLASS_LABEL_TERMS: Record<DrugClass, string[]> = {
  ssri: ["ssri", "selective serotonin reuptake inhibitor", "serotonergic"],
  opioid: ["opioid", "opiate", "narcotic analgesic"],
  arb: ["angiotensin receptor blocker", "arb"],
  ace_inhibitor: ["ace inhibitor", "angiotensin-converting enzyme"],
  k_sparing_diuretic: ["potassium-sparing diuretic", "potassium sparing diuretic"],
};

// Indian formulations often append a salt suffix (e.g. "Losartan Potassium",
// "Sertraline Hydrochloride") — match by substring, not exact equality.
export function getDrugClasses(saltName: string): DrugClass[] {
  const lower = saltName.trim().toLowerCase();
  const classes: DrugClass[] = [];
  for (const [cls, members] of Object.entries(CLASS_MEMBERS) as [DrugClass, string[]][]) {
    if (members.some((m) => lower.includes(m))) classes.push(cls);
  }
  return classes;
}
