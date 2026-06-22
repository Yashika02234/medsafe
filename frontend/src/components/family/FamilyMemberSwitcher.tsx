"use client";

import type { FamilyMember } from "@/components/family/FamilyMemberCard";

interface FamilyMemberSwitcherProps {
  members: FamilyMember[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function FamilyMemberSwitcher({
  members,
  selectedId,
  onSelect,
}: FamilyMemberSwitcherProps) {
  if (members.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-4 py-[7px] rounded-full border text-[13px] font-medium transition-colors ${
          selectedId === null
            ? "bg-[var(--ms-acc)] border-[var(--ms-acc)] text-white"
            : "bg-transparent border-[var(--ms-bord)] text-[var(--ms-txt3)]"
        }`}
      >
        All
      </button>
      {members.map((member) => (
        <button
          key={member.id}
          type="button"
          onClick={() => onSelect(member.id)}
          className={`flex-shrink-0 px-4 py-[7px] rounded-full border text-[13px] font-medium transition-colors ${
            selectedId === member.id
              ? "bg-[var(--ms-acc)] border-[var(--ms-acc)] text-white"
              : "bg-transparent border-[var(--ms-bord)] text-[var(--ms-txt3)]"
          }`}
        >
          {member.is_self ? "You" : member.name}
        </button>
      ))}
    </div>
  );
}
