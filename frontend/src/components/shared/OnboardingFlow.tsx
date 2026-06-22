"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "medsafe_onboarding_complete";

const SLIDES = [
  {
    title: "Welcome to MedSafe",
    body: "Track every medicine in your home, and catch dangerous interactions before they happen.",
    icon: (
      <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    ),
  },
  {
    title: "Add your medicines",
    body: "Search from thousands of Indian brands, or just point your camera at the strip — we'll read the name and expiry for you.",
    icon: (
      <path
        d="M4 7V5a2 2 0 0 1 2-2h2M4 17v2a2 2 0 0 0 2 2h2M20 7V5a2 2 0 0 0-2-2h-2M20 17v2a2 2 0 0 1-2 2h-2M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    ),
  },
  {
    title: "Stay safe",
    body: "We check every combination of your medicines for dangerous interactions, and remind you before anything expires.",
    icon: (
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    ),
  },
  {
    title: "You're all set",
    body: "Add your first medicine to get started — manually, or with a quick scan.",
    icon: (
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    ),
  },
] as const;

export function OnboardingFlow() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function handleGetStarted() {
    dismiss();
    router.push("/medicines");
  }

  if (!visible) return null;

  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--ms-bg)] flex flex-col">
      <div className="flex justify-end px-5 pt-5">
        <button
          type="button"
          onClick={dismiss}
          className="text-[13px] font-semibold text-[var(--ms-txt3)]"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
        >
          {SLIDES.map((s) => (
            <div
              key={s.title}
              className="w-full flex-shrink-0 flex flex-col items-center justify-center text-center px-8 gap-6"
            >
              <div className="w-20 h-20 rounded-3xl bg-[var(--ms-acc-bg)] flex items-center justify-center text-[var(--ms-acc)]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
                  {s.icon}
                </svg>
              </div>
              <div>
                <h2 className="text-[22px] font-extrabold text-[var(--ms-txt)] tracking-[-0.6px] mb-3">
                  {s.title}
                </h2>
                <p className="text-[14px] text-[var(--ms-txt2)] leading-relaxed max-w-[280px] mx-auto">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 pb-10 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {SLIDES.map((s, i) => (
            <div
              key={s.title}
              className={`h-1.5 rounded-full transition-all ${
                i === slide ? "w-6 bg-[var(--ms-acc)]" : "w-1.5 bg-[var(--ms-bord)]"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={isLast ? handleGetStarted : () => setSlide((s) => s + 1)}
          className="w-full bg-[var(--ms-acc)] text-white rounded-2xl py-[16px] text-[16px] font-semibold"
        >
          {isLast ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
