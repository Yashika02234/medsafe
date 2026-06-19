import { z } from "zod";

// Excludes "self" — that value is reserved for the one auto-created member at
// signup and is never user-selectable.
export const RELATIONSHIPS = ["parent", "spouse", "child", "sibling", "other"] as const;

export const FamilyMemberSchema = z.object({
  name: z.string().min(1).max(100),
  relationship: z.enum(RELATIONSHIPS),
});
