"use client";

import { useState } from "react";

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  is_self: boolean;
}

interface FamilyMemberCardProps {
  member: FamilyMember;
  stats: { total: number; expiringSoon: number };
  onEdit: (member: FamilyMember) => void;
  onDelete: (id: string) => void;
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  parent: "Parent",
  spouse: "Spouse",
  child: "Child",
  sibling: "Sibling",
  other: "Other",
};

export function FamilyMemberCard({ member, stats, onEdit, onDelete }: FamilyMemberCardProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/family/${member.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) onDelete(member.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className={`bg-[var(--ms-surf)] rounded-2xl p-4 border flex flex-col gap-3 ${
        member.is_self ? "border-[var(--ms-acc)]" : "border-[var(--ms-bord)]"
      }`}
    >
      <div className="w-12 h-12 rounded-2xl bg-[var(--ms-acc-bg)] flex items-center justify-center">
        <span className="text-[var(--ms-acc)] font-extrabold text-[20px]">
          {member.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div>
        <p className="text-[14px] font-bold text-[var(--ms-txt)] leading-tight truncate">
          {member.name}
        </p>
        <p className="text-[11px] text-[var(--ms-acc)] font-medium mt-0.5">
          {member.is_self ? "You (primary)" : RELATIONSHIP_LABELS[member.relationship]}
        </p>
      </div>
      <div className="flex gap-2">
        <MiniStat label="Meds" value={String(stats.total)} />
        <MiniStat label="Expiring" value={String(stats.expiringSoon)} />
      </div>

      {!member.is_self && (
        <>
          {confirmingDelete ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="flex-1 bg-[var(--ms-surf2)] text-[var(--ms-txt2)] border border-[var(--ms-bord)] rounded-xl py-2 text-[12px] font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-[var(--ms-red)] text-white rounded-xl py-2 text-[12px] font-semibold disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Confirm"}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(member)}
                className="flex-1 bg-[var(--ms-surf2)] text-[var(--ms-txt2)] border border-[var(--ms-bord)] rounded-xl py-2 text-[12px] font-semibold"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="flex-1 bg-[var(--ms-red-bg)] text-[var(--ms-red)] border border-[var(--ms-red)] rounded-xl py-2 text-[12px] font-semibold"
              >
                Remove
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 bg-[var(--ms-surf2)] rounded-xl px-2 py-1.5 text-center">
      <p className="text-[13px] font-bold text-[var(--ms-txt)]">{value}</p>
      <p className="text-[10px] text-[var(--ms-txt3)]">{label}</p>
    </div>
  );
}
