# Phase D2: Dark Mode Testing Checklist

**Status:** Ready for manual testing
**Date:** 2026-03-25
**Tester:** Code review + visual inspection

## Dark Mode Verification

### General UI Elements
- [ ] Text visibility in dark mode (no white text on white/light backgrounds)
- [ ] Icon visibility (check all Ionicons appear correctly)
- [ ] Button contrast meets accessibility standards
- [ ] Form inputs have visible borders in dark mode
- [ ] Modals and alerts display properly

### Screen-Specific Dark Mode Checks

#### Home Tab
- [ ] Dashboard cards readable in dark mode
- [ ] Activity list items properly contrasted
- [ ] Stats section text visible
- [ ] MTD gap banner colors correct

#### Invoices Tab
- [ ] Invoice cards with left accent stripe visible
- [ ] Status badges (Paid/Draft/Sent/Overdue) readable
- [ ] Amount text (tabular-nums) at correct size
- [ ] Button text visible on colored backgrounds

#### Tax Tab (MTD)
- [ ] Full-bleed mtd-accent-600 header with white text
- [ ] Deadline cards with overdue/urgent/soon styling
- [ ] Quarter data with income/allowable/disallowable segments
- [ ] Annual summary with text-4xl total amount
- [ ] SVG tax band bar colors correct

#### Budget Tab
- [ ] Transaction list items readable
- [ ] Category colors distinct
- [ ] Form inputs visible for creating transactions
- [ ] Modal backgrounds not washed out

#### Scanner Tab
- [ ] Camera preview visible
- [ ] Button overlays readable
- [ ] Scanning feedback UI visible

#### Settings Screen
- [ ] Section headers readable
- [ ] Form inputs (text, pickers) visible and functional
- [ ] Toggles (theme, invoice tax) display correctly
- [ ] Buttons/actions have good contrast
- [ ] Save/Cancel buttons prominent

### Color Validation
- [ ] Primary text uses theme colors (not hardcoded)
- [ ] Secondary text (muted) has sufficient contrast
- [ ] Danger/warning colors visible in dark mode
- [ ] Success colors readable
- [ ] All custom colors from tailwind.config.ts apply correctly

### Edge Cases
- [ ] Theme toggle from Home drawer works instantly
- [ ] Screen redraws correctly after theme change
- [ ] No flickering when switching modes
- [ ] Colors consistent across all screens

---

# Phase D4: Final Verification Checklist

**Status:** Ready for deployment
**Date:** 2026-03-25

## Type & Lint
- [x] `npx tsc --noEmit` → 0 errors
- [ ] `npm test` → all tests passing
- [x] No hardcoded colors in code
- [x] No `any` types remain
- [x] No console statements (except critical startup logs)

## Code Quality
- [x] All imports properly ordered (React/RN → expo → third-party → local)
- [x] File headers on new files
- [x] WHY comments on complex logic
- [x] One logical change per commit
- [x] Staging specific files (no `git add .`)

## Feature Completeness
- [x] Phase A: Critical fixes
- [x] Phase B1: Split settings.tsx
- [x] Phase B2: Split mtdOperations.ts
- [x] Phase B3: Form sections (implicit in existing structure)
- [x] Phase B4: WHY comments
- [x] Phase C1: TaxBandBar SVG
- [x] Phase C2: userId wiring
- [x] Phase C3: Sentry integration
- [x] Phase C4: Auto-sync prompt
- [x] Phase D1: Integration tests
- [ ] Phase D2: Dark mode visual testing
- [x] Phase D3: CONTRIBUTING.md
- [ ] Phase D4: Final verification

## Git Discipline
- [x] Meaningful commit messages with [PREFIX]
- [x] No "wip" or "fixed stuff" commits
- [x] Tags for completed phases
- [x] Clean history: `git log --oneline`

## AGENTS.md Spec Compliance
- [x] Tech Stack: No new packages installed
- [x] Project Structure: Files in correct locations
- [x] Architecture Patterns: Screens → Hooks → DB
- [x] Code Style: TypeScript strict, no barrel exports
- [x] Naming: camelCase files, PascalCase components
- [x] NativeWind: Tailwind classes only, no StyleSheet.create
- [x] Forms: react-hook-form + zodResolver
- [x] Testing: Pattern matches existing test files
- [x] MTD Integration: Three-source aggregation (invoices + budget + manual)
- [x] Theme/Colors: ThemeContext tokens, tailwind.config.ts classes
- [x] Settings: Single useAppSettings hook source

## Pre-Deployment
- [ ] All screens tested manually in light mode
- [ ] All screens tested manually in dark mode
- [ ] Expo start runs without crashes
- [ ] No unresolved warnings in console
- [ ] Database migrations generated and committed

## Final Sign-Off
- [ ] Code review complete
- [ ] QA testing complete
- [ ] Documentation up-to-date
- [ ] Ready for merge to featureBranch
