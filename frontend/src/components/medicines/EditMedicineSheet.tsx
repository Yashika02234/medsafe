"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { formatExpiryDisplay } from "@/lib/utils/expiry";

interface Ingredient {
  id: string;
  salt_name: string;
  rxcui: string | null;
}

interface Medicine {
  id: string;
  brand_name: string;
  expiry_date: string;
  quantity: number | null;
  dosage_schedule: string | null;
  ingredients: Ingredient[];
}

interface EditMedicineSheetProps {
  medicine: Medicine | null;
  onClose: () => void;
  onUpdated: () => void;
}

const FormSchema = z.object({
  expiry_month_year: z
    .string()
    .regex(/^\d{2}\/\d{4}$/, "Enter expiry as MM/YYYY"),
  quantity: z.string().optional(),
  dosage_schedule: z.string().optional(),
});

function toMonthYear(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${mm}/${d.getFullYear()}`;
}

export function EditMedicineSheet({ medicine, onClose, onUpdated }: EditMedicineSheetProps) {
  const [expiryMonthYear, setExpiryMonthYear] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (medicine) {
      setExpiryMonthYear(toMonthYear(medicine.expiry_date));
      setQuantity(medicine.quantity != null ? String(medicine.quantity) : "");
      setDosage(medicine.dosage_schedule ?? "");
      setErrors({});
      setServerError("");
    }
  }, [medicine]);

  function handleExpiryInput(value: string) {
    const digits = value.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length >= 2) {
      formatted = digits.slice(0, 2) + "/" + digits.slice(2, 6);
    }
    setExpiryMonthYear(formatted);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicine) return;
    setServerError("");

    const parsed = FormSchema.safeParse({
      expiry_month_year: expiryMonthYear,
      quantity: quantity || undefined,
      dosage_schedule: dosage || undefined,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errs[String(issue.path[0])] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const res = await fetch(`/api/medicines/${medicine.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expiry_month_year: parsed.data.expiry_month_year,
          quantity: parsed.data.quantity ? parseInt(parsed.data.quantity, 10) : null,
          dosage_schedule: parsed.data.dosage_schedule || null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setServerError(data.error ?? "Failed to update medicine.");
        return;
      }

      onUpdated();
      onClose();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!medicine) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal
        aria-label="Edit medicine"
        className="fixed bottom-0 left-0 right-0 z-[60] max-w-lg mx-auto bg-[var(--ms-surf)] rounded-t-3xl shadow-2xl max-h-[85dvh] flex flex-col"
      >
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--ms-bord)]" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="px-5 pt-2 overflow-y-auto flex-1 min-h-0">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-extrabold text-[var(--ms-txt)] tracking-[-0.5px]">
              Edit Medicine
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-[var(--ms-surf2)] flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--ms-txt3)">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-4 pb-4">
            <div className="bg-[var(--ms-surf2)] rounded-2xl px-4 py-3">
              <p className="text-[11px] text-[var(--ms-txt3)] uppercase tracking-widest mb-1">
                Medicine
              </p>
              <p className="text-[15px] font-bold text-[var(--ms-txt)]">{medicine.brand_name}</p>
              <p className="text-[12px] text-[var(--ms-txt3)] mt-0.5">
                {medicine.ingredients.map((i) => i.salt_name).join(", ")} · was{" "}
                {formatExpiryDisplay(medicine.expiry_date)}
              </p>
            </div>

            <div>
              <label
                htmlFor="edit_expiry"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Expiry date
              </label>
              <input
                id="edit_expiry"
                type="text"
                inputMode="numeric"
                placeholder="MM/YYYY"
                maxLength={7}
                value={expiryMonthYear}
                onChange={(e) => handleExpiryInput(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors tracking-widest"
              />
              {errors.expiry_month_year && (
                <p className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.expiry_month_year}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="edit_quantity"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Quantity <span className="text-[var(--ms-txt3)] font-normal">(optional)</span>
              </label>
              <input
                id="edit_quantity"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 30"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              />
            </div>

            <div>
              <label
                htmlFor="edit_dosage"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Dosage schedule{" "}
                <span className="text-[var(--ms-txt3)] font-normal">(optional)</span>
              </label>
              <input
                id="edit_dosage"
                type="text"
                placeholder="e.g. 1 tablet twice daily after food"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              />
            </div>
          </div>
          </div>

          <div className="px-5 pb-8 pt-3 flex-shrink-0 flex flex-col gap-3">
            {serverError && (
              <p
                role="alert"
                className="text-sm text-[var(--ms-red)] bg-[var(--ms-red-bg)] rounded-xl px-4 py-3"
              >
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[16px] text-[16px] font-semibold disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
