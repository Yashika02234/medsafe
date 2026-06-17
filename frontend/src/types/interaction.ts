export type InteractionSeverity = "severe" | "moderate" | "mild" | "unknown";

export interface InteractionWarning {
  rxcui_a: string;
  rxcui_b: string;
  drug_a: string;
  drug_b: string;
  severity: InteractionSeverity;
  description: string;
}
