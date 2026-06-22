export default function DashboardLoading() {
  return (
    <div className="px-5 pt-6 flex flex-col gap-5">
      <div className="h-7 w-40 bg-[var(--ms-surf)] rounded-lg animate-pulse" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[76px] bg-[var(--ms-surf)] rounded-2xl animate-pulse border border-[var(--ms-bord)]" />
        ))}
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[60px] bg-[var(--ms-surf)] rounded-2xl animate-pulse border border-[var(--ms-bord)]" />
        ))}
      </div>
    </div>
  );
}
