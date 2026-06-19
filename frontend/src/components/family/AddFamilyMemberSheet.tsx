"use client";

import { useState, useRef, useEffect } from "react";
import { FamilyMemberSchema, RELATIONSHIPS } from "@/lib/validators/family";

interface AddFamilyMemberSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const RELATIONSHIP_LABELS: Record<(typeof RELATIONSHIPS)[number], string> = {
  parent: "Parent",
  spouse: "Spouse",
  child: "Child",
  sibling: "Sibling",
  other: "Other",
};

export function AddFamilyMemberSheet({ isOpen, onClose, onAdded }: AddFamilyMemberSheetProps) {
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState<(typeof RELATIONSHIPS)[number]>("parent");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setRelationship("parent");
      setErrors({});
      setServerError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    const parsed = FamilyMemberSchema.safeParse({ name, relationship });
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
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!data.success) {
        setServerError(data.error ?? "Failed to add family member.");
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
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal
        aria-label="Add family member"
        className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-[var(--ms-surf)] rounded-t-3xl shadow-2xl"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--ms-bord)]" />
        </div>

        <div className="px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[18px] font-extrabold text-[var(--ms-txt)] tracking-[-0.5px]">
              Add Family Member
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

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
            <div>
              <label htmlFor="member_name" className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2">
                Name
              </label>
              <input
                id="member_name"
                ref={inputRef}
                type="text"
                placeholder="e.g. Mom, Dad, Riya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] placeholder:text-[var(--ms-txt3)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              />
              {errors.name && <p className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="member_relationship" className="block text-[13px] font-medium text-[var(--ms-txt2)] mb-2">
                Relationship
              </label>
              <select
                id="member_relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value as (typeof RELATIONSHIPS)[number])}
                className="w-full bg-[var(--ms-surf2)] border border-[var(--ms-bord)] rounded-2xl px-4 py-[14px] text-[15px] text-[var(--ms-txt)] outline-none focus:border-[var(--ms-acc)] transition-colors"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {RELATIONSHIP_LABELS[r]}
                  </option>
                ))}
              </select>
              {errors.relationship && (
                <p className="mt-1.5 text-sm text-[var(--ms-red)]">{errors.relationship}</p>
              )}
            </div>

            {serverError && (
              <p role="alert" className="text-sm text-[var(--ms-red)] bg-[var(--ms-red-bg)] rounded-xl px-4 py-3">
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[16px] text-[16px] font-semibold disabled:opacity-50 mt-1"
            >
              {submitting ? "Adding…" : "Add Member"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
