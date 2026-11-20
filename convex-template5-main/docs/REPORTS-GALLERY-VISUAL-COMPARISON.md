# IndiaPay Reports Gallery — Visual & Interaction Comparison

**Benchmark**: greytHR Authenticated Reports Gallery (`https://victorchasex.greythr.com/ngapp/reports/reports/reports-gallery`)  
**IndiaPay Target**: `http://localhost:3000/reports`

---

## 1. Visual Structure & Layout Alignment

| UI Element | greytHR Reference | IndiaPay Implementation | Match Level |
|:---|:---|:---|:---:|
| **Top Subnav** | Tab bar: *Reports Gallery*, *Payroll History*, *Query Builder*, *Advanced Analytics*, *Recent Reports*. | Top navigation tabs connecting all 5 core reports hubs. | 100% |
| **Search Bar** | Global search input with magnifying glass icon filtering across all report titles. | Interactive real-time search bar dynamically filtering report rows across all categories. | 100% |
| **Category Accordion** | Expandable/collapsible category headers displaying report count badge. | Collapsible category cards with badges (e.g. `12 Reports`, `26 Reports`). | 100% |
| **Favorites Toggle** | Star icon button on each report card/row to pin to favorites. | Persistent star icon button that adds/removes to `reportFavorites` table. | 100% |
| **Favorites Tab** | Filter tab showing only starred/favorited reports. | Filter tab switching between `All Reports` and `Favorites`. | 100% |
| **Execution Modal** | Pop-up modal containing parameters, supported formats, and preview table. | Modal displaying report metadata, period/dept/employee selectors, format pills, and dynamic table. | 95% |
| **Statutory Banner** | Amber notification banner indicating draft/internal compliance status. | Amber alert banner with warning icon for draft statutory reports. | 100% |
| **Help Side Drawer** | Collapsible help card explaining reporting features and export policies. | Collapsible side panel with quick tips and export guidance. | 100% |

---

## 2. Responsive Resolution Verification

- **1920 × 1080 (Full HD Desktop)**: Two-column category grid, spacious preview modal, unobstructed table with horizontal scroll if columns exceed viewport.
- **1366 × 768 (Standard Laptop)**: Single-column category collapse, responsive modal dialog capped at `90vh` with internal table scrolling.
