"use client";

import { useState } from "react";
import Link from "next/link";
import { formatExpiryDisplay, getExpiryStatus } from "@/lib/utils/expiry";

interface Ingredient {
  id: string;
  salt_name: string;
  rxcui: string | null;
}

interface Medicine {
  id: string;
  family_member_id: string;
  brand_name: string;
  generic_name: string | null;
  expiry_date: string;
  quantity: number | null;
  dosage_schedule: string | null;
  resolution_status: string;
  ingredients: Ingredient[];
}

interface MedicineCardProps {
  medicine: Medicine;
  onDelete: (id: string) => void;
  onEdit: (medicine: Medicine) => void;
  hasInteraction?: boolean;
}

const STATUS_CONFIG = {
  expired: {
    label: "Expired",
    bar: "bg-[var(--ms-red)]",
    badge: "text-[var(--ms-red)] bg-[var(--ms-red-bg)]",
  },
  expiring_soon: {
    label: "Expiring soon",
    bar: "bg-[var(--ms-amb)]",
    badge: "text-[var(--ms-amb)] bg-[var(--ms-amb-bg)]",
  },
  safe: {
    label: "Safe",
    bar: "bg-[var(--ms-grn)]",
    badge: "text-[var(--ms-grn)] bg-[var(--ms-grn-bg)]",
  },
} as const;

export function MedicineCard({ medicine, onDelete, onEdit, hasInteraction }: MedicineCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const status = getExpiryStatus(medicine.expiry_date);
  const cfg = STATUS_CONFIG[status];
  const salts = medicine.ingredients.map((i) => i.salt_name).join(", ");

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/medicines/${medicine.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) onDelete(medicine.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-[var(--ms-surf)] rounded-2xl border border-[var(--ms-bord)] overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-stretch text-left"
      >
        {/* Status colour bar */}
        <div className={`w-1 flex-shrink-0 ${cfg.bar}`} />

        <div className="flex-1 px-4 py-4 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[15px] font-bold text-[var(--ms-txt)] truncate flex items-center gap-1.5">
                {medicine.brand_name}
                {hasInteraction && (
                  <span
                    title="Interacts with another medicine in your cabinet"
                    className="flex-shrink-0 text-[12px]"
                  >
                    ⚠️
                  </span>
                )}
              </p>
              <p className="text-[12px] text-[var(--ms-txt3)] mt-0.5 truncate">{salts}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                {cfg.label}
              </span>
              <span className="text-[12px] text-[var(--ms-txt3)]">
                {formatExpiryDisplay(medicine.expiry_date)}
              </span>
            </div>
          </div>

          {medicine.quantity != null && (
            <p className="text-[12px] text-[var(--ms-txt3)] mt-2">
              Qty: {medicine.quantity}
            </p>
          )}
        </div>

        {/* Chevron */}
        <div className="flex items-center pr-4">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="var(--ms-txt3)"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[var(--ms-bord)] px-4 py-4 flex flex-col gap-3">
          {medicine.dosage_schedule && (
            <div>
              <p className="text-[11px] text-[var(--ms-txt3)] uppercase tracking-widest mb-1">
                Dosage
              </p>
              <p className="text-[13px] text-[var(--ms-txt2)]">{medicine.dosage_schedule}</p>
            </div>
          )}

          {medicine.resolution_status !== "resolved" && (
            <p className="text-[11px] text-[var(--ms-amb)] bg-[var(--ms-amb-bg)] rounded-xl px-3 py-2">
              Drug interaction data partially unavailable — consult your doctor.
            </p>
          )}

          {hasInteraction && (
            <Link
              href="/interactions"
              className="text-[11px] text-[var(--ms-red)] bg-[var(--ms-red-bg)] rounded-xl px-3 py-2 underline"
            >
              Interacts with another medicine — view details
            </Link>
          )}

          {confirmingDelete ? (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="flex-1 bg-[var(--ms-surf2)] text-[var(--ms-txt2)] border border-[var(--ms-bord)] rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-[var(--ms-red)] text-white rounded-xl py-2.5 text-[13px] font-semibold disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Confirm remove"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onEdit(medicine)}
                className="flex-1 bg-[var(--ms-surf2)] text-[var(--ms-txt2)] border border-[var(--ms-bord)] rounded-xl py-2.5 text-[13px] font-semibold"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex-1 bg-[var(--ms-red-bg)] text-[var(--ms-red)] border border-[var(--ms-red)] rounded-xl py-2.5 text-[13px] font-semibold"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
