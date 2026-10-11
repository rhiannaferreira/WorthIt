# WorthIt frontend

React + TypeScript + Vite prototype for WorthIt: track household essentials, review reorder suggestions, and ask a shopping assistant whether something is worth its price.

Everything runs in the browser with demo data. There are no real purchases, no Amazon sign-in, no cloud resources and no paid API calls.

## Run it

Requires Node 20.19+ (or 22.12+).

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check and build to dist/
npm run preview    # serve the production build
npm run typecheck  # type-check only
```

## Folder structure

```
frontend/
  index.html
  src/
    main.tsx                 app entry
    App.tsx                  layout, navigation, shared add/edit dialog
    index.css                all styles (CSS variables at the top)
    types.ts                 shared types: Essential, ReorderProposal, Product, ChatResponse, Settings
    data/demoData.ts         demo essentials, demo product catalog (fictional brands), default settings
    services/
      api.ts                 async mock API (the only thing components call for data)
      mockAssistant.ts       deterministic assistant replies and the demo WorthIt score
      storage.ts             the only file that touches localStorage
    context/AppDataContext.tsx  shared state + actions that call api.ts
    hooks/useHashRoute.ts    tiny hash router (#/essentials) so views survive a refresh
    utils/
      essentials.ts          days-left estimate, status rules, formatting
      validation.ts          form validation shared by the UI and api.ts
    components/              reusable UI: Modal, cards, badges, toasts, dialogs
    views/                   Dashboard, Essentials, Reorders, Assistant, Settings
```

## Where backend integration goes

All data access goes through `src/services/api.ts`:

| Function | Today | Later |
| --- | --- | --- |
| `getEssentials`, `addEssential`, `updateEssential`, `deleteEssential` | localStorage | essentials API |
| `getReorderProposals`, `approveReorder`, `dismissReorder`, `remindLater` | localStorage, generated from essentials | reorder API |
| `sendChatMessage` | `mockAssistant.ts` rules over the demo catalog | assistant API |
| `getSettings`, `saveSettings`, `resetDemoData` | localStorage | user preferences API |

To connect a real endpoint, replace the body of a function with a `fetch` call and keep its signature and return type (see the example comment at the top of `api.ts`). Components and `AppDataContext` don't need to change. If the backend returns different field names, map them to the types in `src/types.ts` inside `api.ts`.

## How the rules work

- **Days left** = remaining quantity ÷ daily usage, rounded down. Usage must be above 0. Always labelled as an estimate.
- **Status**: *Needs review* when out of stock, inside the reminder lead time, or no estimate is possible. *Running low* within 7 days of the lead time. *Looking good* otherwise.
- **Reorder suggestions** are created for items that are running low or need review. Approving one is simulated: nothing is bought and stock is not changed. Double clicks can't create duplicate approvals. *Remind me later* hides it for 2 days.
- **Demo WorthIt score** = 60% value (price per unit compared with similar demo products) + 40% a demo quality rating set for this prototype, plus 5 for eco-friendly items if that preference is on. It is not based on customer reviews.

## Manual checklist

1. Dashboard shows 6 tracked essentials, 3 running low or needing review, and 3 pending suggestions.
2. Essentials: add an item with daily usage `0` and see the validation message; fix it and save.
3. Enter a non-Amazon link and see the link error; leave it empty or use an `amazon.com` link.
4. Search and filter by category and status; a search with no results shows "No matches" with a Clear filters button.
5. Update an item's quantity and see days left change; edit an item; delete one (Cancel/Escape keeps it, Delete removes it).
6. Refresh the page: changes are still there.
7. Reorders: approve one suggestion (double-click it) and confirm only one approval, with stock unchanged. Try Remind me later and Dismiss; each lands in its own group.
8. Assistant: try each example prompt, see the loading indicator, product cards, the demo verdict, and a fallback for something like "a laptop".
9. Compare two products side by side; Track a product and see it on the Essentials page.
10. Settings: change the budget, save, refresh, and see it kept. Reset demo data restores everything.
11. Resize to phone width: bottom navigation appears and nothing scrolls sideways. Tab through a dialog: focus stays inside and Escape closes it.
