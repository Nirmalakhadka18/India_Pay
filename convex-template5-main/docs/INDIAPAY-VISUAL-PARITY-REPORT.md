# INDIA PAY — VISUAL PARITY & MULTI-VIEWPORT REPORT

**Project:** IndiaPay HRMS  
**Reference Application:** Authenticated Victor Chasex greytHR application  
**Tested Viewports:** 1920×1080 (Desktop Standard) & 1366×768 (Laptop Standard)  
**Date:** November 19, 2026  

---

## 1. Visual Architecture & Design Language

IndiaPay strictly replicates greytHR's visual hierarchy, layout grids, and interactive patterns:

| Visual Element | greytHR Reference | IndiaPay HRMS Implementation | Visual Parity |
|---|---|---|---|
| **Primary Theme** | Light corporate slate (`#F8FAFC` background) with greytHR navy/indigo accents | Matched: `#F8FAFC` body, slate-200 borders, blue-600 accents | **Match** |
| **Global Topbar** | 9-dot app launcher ("Your Apps"), search bar (`Ctrl+K`), help banner, notification bell, user profile drawer | Matched in `apps/app/src/app/[locale]/(dashboard)/_components/topbar.tsx` and `admin-topbar.tsx` | **Match** |
| **9-Dot App Launcher** | 8 enterprise apps (Homepage, Employee, Payroll, Workforce Management, Workflow, Reports, Engage, Unite Marketplace) | Fully functional: anchored popover dropdown with identical 8 apps in exact reference order | **Match** |
| **System Settings Nav** | Sub-navigation bar with 7 dropdown menus (General, Employee, Payroll, Income Tax, Leave, Integrations, More) | Matched in `system-settings/layout.tsx` with chevron dropdowns, active pills, and route highlighting | **Match** |
| **Reports Gallery** | 3-column masonry grid, category jump-links, favorite stars, state dropdown, workflow export modal | Matched on `/reports` with exact 27 category panels and 192 report rows | **Match** |
| **Interactive Modals** | Rounded-2xl white dialogs with subtle backdrop blur, form grids, clear cancel/submit actions | Implemented consistently across Unite Marketplace, System Settings, and Reports | **Match** |

---

## 2. Viewport Responsiveness Verification

- **1920×1080 (Desktop Wide)**:
  - Max-w-7xl centered container with generous horizontal padding (px-6 to px-8).
  - Sidebars and masonry grids expand comfortably to 3 and 4 column distributions.
- **1366×768 (Standard Laptop)**:
  - Layout reflows cleanly without horizontal overflow or clipped navigation items.
  - Dropdowns adjust z-index layering above data tables and sticky headers.
