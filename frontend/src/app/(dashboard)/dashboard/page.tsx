import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkAllInteractions } from "@/lib/services/interactionEngine";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const firstName = (user.user_metadata?.name as string | undefined)
    ?.split(" ")[0] ?? "there";

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const members = await prisma.family_members.findMany({
    where: { user_id: user.id },
    orderBy: [{ is_self: "desc" }, { created_at: "asc" }],
  });
  const multiMember = members.length > 1;

  // Per-member stats — interaction checking is inherently single-person (drug
  // interactions aren't a cross-person concept), so this is N calls, not one.
  const perMember = await Promise.all(
    members.map(async (member) => {
      const [total, expiringSoon, interactionResult] = await Promise.all([
        prisma.medicines.count({
          where: { family_member_id: member.id, is_active: true },
        }),
        prisma.medicines.count({
          where: {
            family_member_id: member.id,
            is_active: true,
            expiry_date: { gte: now, lte: in30Days },
          },
        }),
        checkAllInteractions(member.id),
      ]);
      return { member, total, expiringSoon, alerts: interactionResult.warnings.length };
    })
  );

  const totalMedicines = perMember.reduce((sum, m) => sum + m.total, 0);
  const totalExpiring = perMember.reduce((sum, m) => sum + m.expiringSoon, 0);
  const totalAlerts = perMember.reduce((sum, m) => sum + m.alerts, 0);

  const expiringMedicines =
    totalExpiring > 0
      ? await prisma.medicines.findMany({
          where: {
            family_member: { user_id: user.id },
            is_active: true,
            expiry_date: { gte: now, lte: in30Days },
          },
          orderBy: { expiry_date: "asc" },
          take: 3,
          include: { ingredients: true, family_member: true },
        })
      : [];

  const mostUrgent = expiringMedicines[0] ?? null;

  return (
    <div className="px-5 pt-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-[var(--ms-txt3)] font-medium uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="text-[26px] font-extrabold text-[var(--ms-txt)] tracking-[-0.7px] leading-tight">
            {firstName} 👋
          </h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-[var(--ms-acc-bg)] flex items-center justify-center">
          <span className="text-[var(--ms-acc)] font-bold text-[15px]">
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {/* Aggregate stats grid */}
      <a
        href="/medicines"
        aria-label="View all medicines"
        className="grid grid-cols-3 gap-3 no-underline"
      >
        <StatCard
          label="Medicines"
          value={totalMedicines > 0 ? String(totalMedicines) : "—"}
          variant="acc"
        />
        <StatCard
          label="Expiring"
          value={totalExpiring > 0 ? String(totalExpiring) : "—"}
          variant="amb"
        />
        <StatCard
          label="Alerts"
          value={totalAlerts > 0 ? String(totalAlerts) : "—"}
          variant="red"
        />
      </a>

      {/* Most urgent widget */}
      {mostUrgent && (
        <UrgentWidget medicine={mostUrgent} showMemberName={multiMember} />
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <QuickAction href="/medicines" label="Add Medicine" sublabel="Search & add manually">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="var(--ms-acc)" />
        </QuickAction>
        <QuickAction href="/scan" label="Scan Medicine" sublabel="Use your camera">
          <path
            d="M4 7V5a2 2 0 0 1 2-2h2M4 17v2a2 2 0 0 0 2 2h2M20 7V5a2 2 0 0 0-2-2h-2M20 17v2a2 2 0 0 1-2 2h-2M5 12h14"
            fill="none"
            stroke="var(--ms-acc)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </QuickAction>
      </div>

      {/* Per-member summary cards — only when there's more than one person */}
      {multiMember && (
        <div>
          <h2 className="text-[15px] font-bold text-[var(--ms-txt)] mb-3">Family</h2>
          <div className="flex flex-col gap-2">
            {perMember.map(({ member, total, expiringSoon, alerts }) => (
              <MemberSummaryRow
                key={member.id}
                name={member.is_self ? "You" : member.name}
                total={total}
                expiringSoon={expiringSoon}
                alerts={alerts}
                memberId={member.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expiring soon section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] font-bold text-[var(--ms-txt)]">Expiring Soon</h2>
          <a href="/medicines" className="text-[12px] text-[var(--ms-acc)] font-semibold no-underline">
            See all
          </a>
        </div>

        {expiringMedicines.length === 0 ? (
          <div className="bg-[var(--ms-surf)] rounded-2xl px-5 py-8 flex flex-col items-center gap-3 border border-[var(--ms-bord)]">
            <div className="w-10 h-10 rounded-2xl bg-[var(--ms-grn-bg)] flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ms-grn)">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <p className="text-[13px] text-[var(--ms-txt3)] text-center">
              {totalMedicines === 0
                ? "Add your first medicine using the + button in Cabinet."
                : "Nothing expiring in the next 30 days."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {expiringMedicines.map((med) => (
              <ExpiryRow
                key={med.id}
                name={med.brand_name}
                salts={med.ingredients.map((i) => i.salt_name).join(", ")}
                expiryDate={med.expiry_date}
                memberName={multiMember ? (med.family_member.is_self ? "You" : med.family_member.name) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STAT_COLOR = {
  acc: "text-[var(--ms-acc)]",
  amb: "text-[var(--ms-amb)]",
  red: "text-[var(--ms-red)]",
} as const;

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: keyof typeof STAT_COLOR;
}) {
  return (
    <div className="bg-[var(--ms-surf)] rounded-2xl px-3 py-4 flex flex-col gap-1.5 border border-[var(--ms-bord)]">
      <p className={`text-[22px] font-extrabold leading-none ${STAT_COLOR[variant]}`}>
        {value}
      </p>
      <p className="text-[11px] text-[var(--ms-txt3)] font-medium">{label}</p>
    </div>
  );
}

function UrgentWidget({
  medicine,
  showMemberName,
}: {
  medicine: {
    brand_name: string;
    expiry_date: Date;
    family_member: { name: string; is_self: boolean };
  };
  showMemberName: boolean;
}) {
  const d = new Date(medicine.expiry_date);
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  const label = isExpired
    ? "Expired"
    : daysLeft === 1
    ? "1 day left"
    : `${daysLeft} days left`;
  const memberLabel = medicine.family_member.is_self ? "You" : medicine.family_member.name;

  return (
    <div
      className={`rounded-2xl px-5 py-4 border flex items-center gap-3 ${
        isExpired || daysLeft <= 7
          ? "bg-[var(--ms-red-bg)] border-[var(--ms-red)]"
          : "bg-[var(--ms-amb-bg)] border-[var(--ms-amb)]"
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-[var(--ms-surf)] flex items-center justify-center flex-shrink-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill={isExpired || daysLeft <= 7 ? "var(--ms-red)" : "var(--ms-amb)"}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--ms-txt3)] mb-0.5">
          Most urgent
        </p>
        <p className="text-[14px] font-bold text-[var(--ms-txt)] truncate">
          {medicine.brand_name}
          {showMemberName && <span className="font-normal text-[var(--ms-txt3)]"> · {memberLabel}</span>}
        </p>
      </div>
      <span className={`text-[12px] font-bold flex-shrink-0 ${isExpired || daysLeft <= 7 ? "text-[var(--ms-red)]" : "text-[var(--ms-amb)]"}`}>
        {label}
      </span>
    </div>
  );
}

function QuickAction({
  href,
  label,
  sublabel,
  children,
}: {
  href: string;
  label: string;
  sublabel: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="bg-[var(--ms-surf)] border border-[var(--ms-bord)] rounded-2xl px-4 py-4 flex flex-col gap-3 no-underline"
    >
      <div className="w-9 h-9 rounded-xl bg-[var(--ms-acc-bg)] flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24">
          {children}
        </svg>
      </div>
      <div>
        <p className="text-[13px] font-semibold text-[var(--ms-txt)]">{label}</p>
        <p className="text-[11px] text-[var(--ms-txt3)] mt-0.5">{sublabel}</p>
      </div>
    </a>
  );
}

function MemberSummaryRow({
  name,
  total,
  expiringSoon,
  alerts,
  memberId,
}: {
  name: string;
  total: number;
  expiringSoon: number;
  alerts: number;
  memberId: string;
}) {
  return (
    <a
      href={`/medicines?member=${memberId}`}
      className="bg-[var(--ms-surf)] rounded-2xl px-4 py-3 border border-[var(--ms-bord)] flex items-center gap-3 no-underline"
    >
      <div className="w-10 h-10 rounded-2xl bg-[var(--ms-acc-bg)] flex items-center justify-center flex-shrink-0">
        <span className="text-[var(--ms-acc)] font-extrabold text-[15px]">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--ms-txt)] truncate">{name}</p>
        <p className="text-[11px] text-[var(--ms-txt3)] mt-0.5">
          {total} {total === 1 ? "medicine" : "medicines"}
          {expiringSoon > 0 && <span className="text-[var(--ms-amb)]"> · {expiringSoon} expiring</span>}
          {alerts > 0 && <span className="text-[var(--ms-red)]"> · {alerts} warning{alerts > 1 ? "s" : ""}</span>}
        </p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--ms-txt3)" className="flex-shrink-0">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </a>
  );
}

function ExpiryRow({
  name,
  salts,
  expiryDate,
  memberName,
}: {
  name: string;
  salts: string;
  expiryDate: Date | string;
  memberName?: string;
}) {
  const d = new Date(expiryDate);
  const now = new Date();
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft <= 7;

  const expLabel = daysLeft <= 0
    ? "Expired"
    : daysLeft === 1
    ? "1 day left"
    : `${daysLeft} days left`;

  return (
    <div className="bg-[var(--ms-surf)] rounded-2xl px-4 py-3 border border-[var(--ms-bord)] flex items-center gap-3">
      <div
        className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
          isUrgent ? "bg-[var(--ms-red)]" : "bg-[var(--ms-amb)]"
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-[var(--ms-txt)] truncate">
          {name}
          {memberName && <span className="font-normal text-[var(--ms-txt3)]"> · {memberName}</span>}
        </p>
        <p className="text-[11px] text-[var(--ms-txt3)] truncate">{salts}</p>
      </div>
      <span
        className={`text-[11px] font-bold flex-shrink-0 ${
          isUrgent ? "text-[var(--ms-red)]" : "text-[var(--ms-amb)]"
        }`}
      >
        {expLabel}
      </span>
    </div>
  );
}
