# LAPSE Dashboard - AI Coding Instructions

## Project Overview
LAPSE Dashboard is an interactive React + TypeScript application that explores Canadian federal and British Columbia provincial legislation relevant to Pacific salmon conservation. It maps legislation to management domains and IUCN threat categories, enabling environmental policy research and analysis.

**Tech Stack:** React 19, TypeScript, Vite, Recharts (visualizations), XLSX (file parsing)

## Architecture & Data Flow

### Core Concept
The app loads legislation data from a JSON file (`LAPSE_compendium.json` in public/), applies multi-dimensional filtering, and displays results through three views: dashboard stats, interactive visualizations, and searchable legislation list.

### Key Components & Responsibilities
- **App.tsx** (main orchestrator): State management, data loading, tab routing, filter state
- **Filters.tsx**: 5-filter UI for narrowing data (jurisdiction, management domain, act, legislation, keywords)
- **Visualizations.tsx**: Recharts bar/pie charts for keyword frequency and IUCN threat distribution
- **LegislationList.tsx**: Searchable, detailed view of filtered legislation records
- **Sidebar.tsx**: Navigation, tabs, help/disclaimer modals

### Data Pipeline
1. App loads JSON from `public/LAPSE_compendium.json` (with fallback attempts)
2. Data stored in `LegislationItem[]` state
3. Filters applied via `useMemo` hooks to compute filtered dataset
4. Filtered data passed to components for display/visualization

### Key Data Structures
```typescript
LegislationItem {
  id, jurisdiction (Federal|Provincial), act_name, legislation_name,
  section, heading, aggregate_paragraph, management_domain,
  iucn_threat, clause_type, scope,
  management_domain_keywords, clause_type_keywords, aggregate_keywords
}
FilterState { jurisdiction, managementDomain, searchTerm, actName, legislationName }
```

## Critical Patterns & Conventions

### Filter Computation Pattern
Filters use controlled component pattern: `useCallback` handlers update `FilterState`, `useMemo` hooks compute derived options (act counts, legislation counts) and filter results. Always filter ALL dimensions against the current filter state.

### Keyword Processing
Keywords are semicolon-separated strings. Always `.split(';').map(k => k.trim())` when parsing keyword fields. Example: `management_domain_keywords` contains domain-specific terms for visualization aggregation.

### Constants Organization
Management domains, jurisdictions, and color mappings live in the constants file. When adding new filter dimensions or visualizations, extend this file. Jurisdiction color mapping uses Tailwind: `sky-700` (Federal), `green-700` (Provincial).

### Recharts Integration
Charts are responsive containers with custom Tooltip styling and color palettes. Data arrays must be pre-sorted by descending value. Example from Visualizations: keyword frequency bars and IUCN threat pie chart both compute data in `useMemo` to avoid recalculation.

## Build & Deployment

### Development
- `npm run dev` - Start Vite dev server (port 3000, 0.0.0.0)
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

### Deployment Configuration
- **GitHub Pages Base URL:** `/LAPSE_dashboard/` (configured in the vite config file, line 9)
- **Static Asset Path:** Public assets (JSON, icons) served from `public/` folder
- When deploying to different repo/domain, update `base` in vite.config.ts

## Important Constraints & Gotchas

1. **JSON Loading Precedence:** App tries 3 paths: `LAPSE_compendium.json`, `./LAPSE_compendium.json`, `/LAPSE_compendium.json`. First successful fetch wins. Diagnostic logs added to UI for troubleshooting.

2. **TypeScript Strict Mode:** Project uses TypeScript ~5.8.2 with strict null checks. All component props must be properly typed with `React.FC<Props>` pattern.

3. **Responsive Design:** Uses Tailwind CSS with mobile-first approach. Components adapt to viewport using flex/grid with responsive breakpoints (e.g., `lg:grid-cols-2`).

4. **Tab-Based Navigation:** Two tabs (`'dashboard'` and `'explorer'`) controlled via `activeTab` state. Component visibility toggled by tab value; state reset on tab change is often needed.

## Common Development Tasks

- **Adding a new filter:** Create FilterOption computation in App.tsx (extract unique values from data), add to Filters component, update FilterState interface
- **Adding visualizations:** Extend Visualizations.tsx with new `useMemo` for data aggregation, use Recharts containers with consistent styling
- **Modifying data columns:** Update LegislationItem interface in types.ts, verify JSON data has matching fields
- **Styling:** Use Tailwind utility classes (no CSS files); follow existing spacing/typography patterns for consistency

## Testing & Debugging
- Check browser console for Vite build errors and JSON loading diagnostics
- App displays real-time diagnostic log in UI (see `diagnostics` state)
- Test with sample JSON in `public/LAPSE_compendium.json` before deployment
