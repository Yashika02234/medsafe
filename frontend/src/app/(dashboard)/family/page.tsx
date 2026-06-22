"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FamilyMemberCard, type FamilyMember } from "@/components/family/FamilyMemberCard";
import { AddFamilyMemberSheet } from "@/components/family/AddFamilyMemberSheet";
import { EditFamilyMemberSheet } from "@/components/family/EditFamilyMemberSheet";
import { getExpiryStatus } from "@/lib/utils/expiry";

interface MedicineForStats {
  family_member_id: string;
  expiry_date: string;
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [medicines, setMedicines] = useState<MedicineForStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [familyRes, medicinesRes] = await Promise.all([
        fetch("/api/family"),
        fetch("/api/medicines"),
      ]);
      const familyData = await familyRes.json();
      const medicinesData = await medicinesRes.json();
      if (familyData.success) setMembers(familyData.data);
      else setLoadError(true);
      if (medicinesData.success) setMedicines(medicinesData.data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleDelete(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function statsFor(memberId: string) {
    const mine = medicines.filter((m) => m.family_member_id === memberId);
    const expiringSoon = mine.filter((m) => getExpiryStatus(m.expiry_date) !== "safe").length;
    return { total: mine.length, expiringSoon };
  }

  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px]">
            Family
          </h1>
          <p className="text-[13px] text-[var(--ms-txt3)] mt-1">
            Manage medicine cabinets for everyone
          </p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="w-9 h-9 rounded-full bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center no-underline"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ms-txt2)">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </Link>
      </div>

      {/* Member grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[160px] bg-[var(--ms-surf)] rounded-2xl animate-pulse border border-[var(--ms-bord)]"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-[15px] font-semibold text-[var(--ms-txt)]">
            Couldn&apos;t load your family
          </p>
          <p className="text-[13px] text-[var(--ms-txt3)] text-center max-w-[260px]">
            Something went wrong. Please check your connection and try again.
          </p>
          <button
            type="button"
            onClick={loadData}
            className="bg-[var(--ms-acc)] text-white rounded-2xl px-6 py-[10px] text-[14px] font-semibold"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {members.map((member) => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              stats={statsFor(member.id)}
              onEdit={setEditingMember}
              onDelete={handleDelete}
            />
          ))}

          {/* Add member card */}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="bg-transparent rounded-2xl p-4 border border-dashed border-[var(--ms-bord)] flex flex-col items-center justify-center gap-3 text-center min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--ms-surf)] border border-[var(--ms-bord)] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ms-acc)">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-[var(--ms-txt2)]">Add Member</p>
          </button>
        </div>
      )}

      <AddFamilyMemberSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdded={loadData}
      />

      <EditFamilyMemberSheet
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onUpdated={loadData}
      />
    </div>
  );
}
