# Folder Structure — MedSafe

```
medsafe/
│
├── CLAUDE.md                          # Entry point — Claude reads this first
├── _state.md                          # Current project state (MOST IMPORTANT FILE)
├── .gitignore
├── README.md
│
├── .claude/
│   ├── memory/
│   │   ├── product-vision.md          # What we're building and why
│   │   ├── tech-stack.md              # Locked tech decisions
│   │   ├── architecture.md            # System design and data flow
│   │   ├── coding-rules.md            # Code standards and conventions
│   │   ├── design-system.md           # UI/UX source of truth (placeholder)
│   │   ├── security.md                # Security rules and practices
│   │   ├── testing.md                 # Testing strategy and checklists
│   │   └── defects.md                 # Mistake log — Claude learns from this
│   │
│   ├── agents/
│   │   ├── planner.md                 # Planning agent prompt
│   │   ├── implementer.md             # Implementation agent prompt
│   │   └── reviewer.md                # Code review agent prompt
│   │
│   ├── workflows/
│   │   ├── session-start.md           # How to begin every session
│   │   ├── session-end.md             # How to end every session
│   │   ├── implementation.md          # Plan → Build → Review → Document flow
│   │   └── prompts.md                 # Copy-paste prompts for every scenario
│   │
│   └── outputs/
│       ├── implementation-roadmap.md  # Master roadmap (all phases)
│       ├── phase-00/                  # Planning phase outputs
│       ├── phase-01/                  # Foundation phase outputs
│       ├── phase-02/                  # Medicine Cabinet outputs
│       ├── phase-03/                  # OCR Scanner outputs
│       ├── phase-04/                  # Interaction Engine outputs
│       ├── phase-05/                  # Notifications outputs
│       └── phase-06/                  # Family Mode outputs
│
├── frontend/                          # Next.js 14 App
│   ├── src/
│   │   ├── app/                       # App Router pages
│   │   │   ├── (auth)/                # Auth pages (login, signup)
│   │   │   ├── (dashboard)/           # Protected pages
│   │   │   ├── api/                   # API routes (BFF)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components
│   │   │   └── shared/                # Reusable app components
│   │   ├── lib/
│   │   │   ├── api/                   # API service functions
│   │   │   ├── supabase/              # Supabase client config
│   │   │   ├── utils/                 # Utility functions
│   │   │   └── validators/            # Zod schemas
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── types/                     # TypeScript interfaces
│   │   └── styles/                    # Global styles
│   ├── public/
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── backend/                           # FastAPI Python Service
│   ├── app/
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── config.py                  # Environment variables
│   │   ├── routes/
│   │   │   ├── ocr.py                 # POST /ocr/scan
│   │   │   ├── drug.py                # POST /drug/resolve
│   │   │   ├── interactions.py        # POST /interactions/check
│   │   │   └── cron.py                # POST /cron/check-expiry
│   │   ├── services/
│   │   │   ├── ocr_service.py         # Image preprocessing + OCR
│   │   │   ├── drug_resolver.py       # Brand → salt → RxCUI
│   │   │   ├── interaction_engine.py  # RxNav interaction checking
│   │   │   └── notification_service.py# Email alerts via Resend
│   │   ├── clients/
│   │   │   ├── rxnorm_client.py       # RxNorm API client
│   │   │   ├── rxnav_client.py        # RxNav Interaction API client
│   │   │   └── resend_client.py       # Resend email client
│   │   ├── models/
│   │   │   ├── schemas.py             # Pydantic request/response models
│   │   │   └── drug_data.py           # CDSCO data loader
│   │   └── data/
│   │       └── cdsco_brands.json      # Indian brand → salt mapping
│   ├── tests/
│   │   ├── test_ocr_service.py
│   │   ├── test_drug_resolver.py
│   │   ├── test_interaction_engine.py
│   │   ├── conftest.py
│   │   └── fixtures/
│   │       └── sample_strips/         # Test medicine strip images
│   ├── requirements.txt
│   ├── Dockerfile (optional, Phase 6+)
│   └── .env.example
│
├── prisma/
│   ├── schema.prisma                  # Database schema
│   └── migrations/                    # Auto-generated migrations
│
└── docs/
    ├── api-reference.md               # API endpoint documentation
    └── deployment.md                   # Deployment instructions
```
