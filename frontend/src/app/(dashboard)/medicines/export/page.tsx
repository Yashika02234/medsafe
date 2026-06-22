"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { formatExpiryDisplay } from "@/lib/utils/expiry";
import { MEDICAL_DISCLAIMER } from "@/lib/legal";

interface Ingredient {
  id: string;
  salt_name: string;
}

interface Medicine {
  id: string;
  brand_name: string;
  generic_name: string | null;
  dosage_schedule: string | null;
  expiry_date: string;
  ingredients: Ingredient[];
}

interface FamilyMember {
  id: string;
  name: string;
  is_self: boolean;
}

export default function ExportPage() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("member");
    setMemberId(id);
  }, []);

  useEffect(() => {
    if (!memberId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const [familyRes, medicinesRes] = await Promise.all([
          fetch("/api/family"),
          fetch(`/api/medicines?family_member_id=${memberId}`),
        ]);
        const familyData = await familyRes.json();
        const medicinesData = await medicinesRes.json();
        if (cancelled) return;

        if (!familyData.success || !medicinesData.success) {
          setError("Couldn't load this medication list. Please try again.");
          return;
        }
        const found = familyData.data.find((m: FamilyMember) => m.id === memberId);
        if (!found) {
          setError("Family member not found.");
          return;
        }
        setMember(found);
        setMedicines(medicinesData.data);
      } catch {
        if (!cancelled) setError("Couldn't load this medication list. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="px-5 pt-6 pb-10 flex flex-col gap-5">
      {/* Screen-only controls — hidden when printing */}
      <div className="print:hidden flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ms-txt2)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
          Back
        </button>
        {member && medicines.length > 0 && (
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-[var(--ms-acc)] text-white rounded-xl px-4 py-2 text-[13px] font-semibold"
          >
            Print / Save as PDF
          </button>
        )}
      </div>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[60px] bg-[var(--ms-surf)] rounded-2xl animate-pulse border border-[var(--ms-bord)]"
            />
          ))}
        </div>
      )}

      {!loading && error && (
        <p className="text-[14px] text-[var(--ms-red)] bg-[var(--ms-red-bg)] rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {!loading && !error && member && medicines.length === 0 && (
        <p className="text-[14px] text-[var(--ms-txt3)] text-center py-10">
          {member.is_self ? "You have" : `${member.name} has`} no active medicines to export yet.
        </p>
      )}

      {!loading && !error && member && medicines.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-[20px] font-extrabold text-[var(--ms-txt)] tracking-[-0.5px]">
              Medication List — {member.is_self ? "You" : member.name}
            </h1>
            <p className="text-[12px] text-[var(--ms-txt3)] mt-1">
              Generated {generatedDate} via MedSafe
            </p>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--ms-bord)]">
                <Th>Brand Name</Th>
                <Th>Generic / Salt</Th>
                <Th>Dosage</Th>
                <Th>Expiry</Th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((med) => (
                <tr key={med.id} className="border-b border-[var(--ms-bord)]">
                  <Td>{med.brand_name}</Td>
                  <Td>{med.ingredients.map((i) => i.salt_name).join(", ") || "—"}</Td>
                  <Td>{med.dosage_schedule || "—"}</Td>
                  <Td>{formatExpiryDisplay(med.expiry_date)}</Td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-[11px] text-[var(--ms-txt3)] text-center mt-4">
            {MEDICAL_DISCLAIMER.export}
          </p>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ms-txt3)] py-2 pr-3">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="text-[13px] text-[var(--ms-txt)] py-2.5 pr-3">{children}</td>;
}
