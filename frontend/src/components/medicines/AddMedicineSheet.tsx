"use client";

import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { useMedicineSearch, type CdscoEntry } from "@/hooks/useMedicineSearch";

interface AddMedicineSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  initialBrandQuery?: string;
  initialExpiry?: string;
  scanConfidence?: number;
}

const FormSchema = z.object({
  brand_name: z.string().min(1, "Medicine name is required"),
  salts: z.array(z.string()).min(1, "Salt information is required"),
  expiry_month_year: z
    .string()
    .regex(/^\d{2}\/\d{4}$/, "Enter expiry as MM/YYYY"),
  quantity: z.string().optional(),
  dosage_schedule: z.string().optional(),
});

export function AddMedicineSheet({
  isOpen,
  onClose,
  onAdded,
  initialBrandQuery,
  initialExpiry,
  scanConfidence,
}: AddMedicineSheetProps) {
  const { results, search, clear, loading: searchLoading } = useMedicineSearch();
  const [brandQuery, setBrandQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<CdscoEntry | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [expiryMonthYear, setExpiryMonthYear] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dosage, setDosage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset form when sheet opens — pre-fill from a scan result if provided
  useEffect(() => {
    if (isOpen) {
      setBrandQuery(initialBrandQuery ?? "");
      setSelectedEntry(null);
      setExpiryMonthYear(initialExpiry ?? "");
      setQuantity("");
      setDosage("");
      setErrors({});
      setServerError("");
      clear();
      if (initialBrandQuery) {
        setShowDropdown(true);
        search(initialBrandQuery);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, clear, search, initialBrandQuery, initialExpiry]);

  function handleBrandInput(value: string) {
    setBrandQuery(value);
    setSelectedEntry(null);
    setShowDropdown(true);
    search(value);
  }

  function handleSelectEntry(entry: CdscoEntry) {
    setSelectedEntry(entry);
    setBrandQuery(entry.name);
    setShowDropdown(false);
    clear();
  }

  // Format expiry input: auto-insert slash after MM
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
    setServerError("");

    const parsed = FormSchema.safeParse({
      brand_name: brandQuery,
      salts: selectedEntry?.salts ?? [],
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
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_name: parsed.data.brand_name,
          salts: parsed.data.salts,
          expiry_month_year: parsed.data.expiry_month_year,
          quantity: parsed.data.quantity ? parseInt(parsed.data.quantity, 10) : undefined,
          dosage_schedule: parsed.data.dosage_schedule || undefined,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setServerError(data.error ?? "Failed to add medicine.");
        return;
      }

      onAdded();
      onClose();
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal
        aria-label="Add medicine"
        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-[var(--ms-surf)] rounded-t-3xl shadow-2xl"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--ms-bord)]" />
        </div>

        <div className="px-5 pb-8 pt-2 overflow-y-auto max-h-[88vh]">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-extrabold text-[var(--ms-txt)] tracking-[-0.5px]">
              Add Medicine
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

          {scanConfidence !== undefined && (
            <div
              className={`mb-4 px-4 py-3 rounded-2xl text-[13px] font-medium ${
                scanConfidence < 0.7
                  ? "bg-[var(--ms-amb-bg)] text-[var(--ms-amb)]"
                  : "bg-[var(--ms-acc-bg)] text-[var(--ms-acc)]"
              }`}
            >
              {scanConfidence < 0.7
                ? "Scanned — confidence was low, please double-check these details"
                : "Scanned — please confirm these details"}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            {/* Brand name search */}
            <div className="relative">
              <label
                htmlFor="brand_name"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Medicine name
              </label>
              <input
                id="brand_name"
                ref={inputRef}
                type="text"
                placeholder="Search e.g. Crocin, Dolo, Thyronorm…"
                value={brandQuery}
                onChange={(e) => handleBrandInput(e.target.value)}
                onFocus={() => brandQuery.length >= 3 && setShowDropdown(true)}
                autoComplete="off"
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              />

              {/* Autocomplete dropdown */}
              {showDropdown && (results.length > 0 || searchLoading) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--ms-surf)] border border-[var(--ms-bord)] rounded-2xl overflow-hidden z-10 shadow-lg">
                  {searchLoading && results.length === 0 ? (
                    <p className="px-4 py-3 text-[13px] text-[var(--ms-txt3)]">
                      Searching…
                    </p>
                  ) : (
                    results.map((entry) => (
                      <button
                        key={entry.name + entry.mfr}
                        type="button"
                        onClick={() => handleSelectEntry(entry)}
                        className="w-full text-left px-4 py-3 border-b border-[var(--ms-bord)] last:border-0 active:bg-[var(--ms-surf2)]"
                      >
                        <p className="text-[14px] font-semibold text-[var(--ms-txt)] truncate">
                          {entry.name}
                        </p>
                        <p className="text-[11px] text-[var(--ms-txt3)] truncate mt-0.5">
                          {entry.salts.join(", ")} · {entry.mfr}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {errors.brand_name && (
                <p className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.brand_name}</p>
              )}
              {errors.salts && (
                <p className="mt-1.5 text-sm text-[var(--ms-red)]">
                  Please select a medicine from the suggestions
                </p>
              )}
            </div>

            {/* Selected medicine salts preview */}
            {selectedEntry && (
              <div className="bg-[var(--ms-acc-bg)] rounded-2xl px-4 py-3 border border-[var(--ms-acc)]">
                <p className="text-[11px] text-[var(--ms-acc)] font-semibold uppercase tracking-widest mb-1">
                  Ingredients
                </p>
                <p className="text-[13px] text-[var(--ms-txt2)]">
                  {selectedEntry.salts.join(" + ")}
                </p>
              </div>
            )}

            {/* Expiry date */}
            <div>
              <label
                htmlFor="expiry"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Expiry date
              </label>
              <input
                id="expiry"
                type="text"
                inputMode="numeric"
                placeholder="MM/YYYY"
                maxLength={7}
                value={expiryMonthYear}
                onChange={(e) => handleExpiryInput(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors tracking-widest"
              />
              {errors.expiry_month_year && (
                <p className="mt-1.5 text-sm text-[var(--ms-red)]">
                  {errors.expiry_month_year}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Quantity{" "}
                <span className="text-[var(--ms-txt3)] font-normal">(optional)</span>
              </label>
              <input
                id="quantity"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 30"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              />
            </div>

            {/* Dosage */}
            <div>
              <label
                htmlFor="dosage"
                className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2"
              >
                Dosage schedule{" "}
                <span className="text-[var(--ms-txt3)] font-normal">(optional)</span>
              </label>
              <input
                id="dosage"
                type="text"
                placeholder="e.g. 1 tablet twice daily after food"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              />
            </div>

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
              disabled={submitting || !selectedEntry}
              className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[16px] text-[16px] font-semibold disabled:opacity-50 mt-1"
            >
              {submitting ? "Adding medicine…" : "Add to Cabinet"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
