import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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

  const [total, expiringSoon] = await Promise.all([
    prisma.medicines.count({
      where: { family_member: { user_id: user.id }, is_active: true },
    }),
    prisma.medicines.count({
      where: {
        family_member: { user_id: user.id },
        is_active: true,
        expiry_date: { gte: now, lte: in30Days },
      },
    }),
  ]);

  const expiringMedicines = expiringSoon > 0
    ? await prisma.medicines.findMany({
        where: {
          family_member: { user_id: user.id },
          is_active: true,
          expiry_date: { gte: now, lte: in30Days },
        },
        orderBy: { expiry_date: "asc" },
        take: 3,
        include: { ingredients: true },
      })
    : [];

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

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Medicines"
          value={total > 0 ? String(total) : "—"}
          variant="acc"
        />
        <StatCard
          label="Expiring"
          value={expiringSoon > 0 ? String(expiringSoon) : "—"}
          variant="amb"
        />
        <StatCard label="Alerts" value="—" variant="red" />
      </div>

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
              {total === 0
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick action */}
      <a
        href="/medicines"
        className="bg-[var(--ms-surf)] border border-[var(--ms-bord)] rounded-2xl px-5 py-4 flex items-center gap-3 no-underline"
      >
        <div className="w-9 h-9 rounded-xl bg-[var(--ms-acc-bg)] flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--ms-acc)">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-[14px] font-semibold text-[var(--ms-txt)]">Add a medicine</p>
          <p className="text-[12px] text-[var(--ms-txt3)]">Track name, salt & expiry date</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--ms-txt3)">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
        </svg>
      </a>
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

function ExpiryRow({
  name,
  salts,
  expiryDate,
}: {
  name: string;
  salts: string;
  expiryDate: Date | string;
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
        <p className="text-[14px] font-semibold text-[var(--ms-txt)] truncate">{name}</p>
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
