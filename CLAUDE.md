# Planner App

Personal financial planning app built for New Zealand users.

## Tech Stack

- **React 19** with React Router 7 (SPA)
- **Vite 7** for build/dev
- **Tailwind CSS 4** for styling (utility classes only, no CSS files)
- **Chart.js + react-chartjs-2** for charts

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (run to verify changes)
- `npm run lint` — ESLint
- `npm run preview` — preview production build

## Project Structure

```
src/
├── components/          # Shared UI (Modal, StatCard, ProgressBar, Layout, Sidebar)
│   └── charts/          # Chart components (NetWorth, CashFlow, Investment, Debt, Pie)
├── pages/               # Route pages (Dashboard, Income, Bills, Assets, Liabilities, Goals, CostOfLiving, Scenarios, Settings)
├── store/useStore.jsx   # State management (Context + useReducer + localStorage)
└── utils/
    ├── calculations.js  # Projection functions (projectNetWorth, projectMortgage, projectInvestment)
    ├── formatters.js    # formatCurrency, formatPercent, toMonthly, generateId
    └── cityPresets.js   # NZ city cost-of-living data
```

## Architecture

### State Management
- Single `useStore` context with `useReducer` — no external state library
- Actions: `ADD_ITEM`, `UPDATE_ITEM`, `DELETE_ITEM`, `UPDATE_COST_OF_LIVING`, `SET_SETTING`, `SET_HOME_NAME`, `IMPORT_DATA`
- Auto-persists to `localStorage` under key `planner-app-data` on every dispatch
- Migration functions handle backward-compatible schema changes on load

### Page Pattern (CRUD)
All data pages follow the same pattern:
- `emptyItem` template object for new items
- `useState` for `showModal`, `editing`, `form`
- `openAdd()` / `openEdit(item)` to open the Modal
- `handleSave()` dispatches `ADD_ITEM` or `UPDATE_ITEM`
- `handleDelete(id)` dispatches `DELETE_ITEM`

### KiwiSaver Assets
- Assets with `type: 'kiwisaver'` have three contribution fields: `kiwiGovt` (yearly), `kiwiEmployer` (monthly), `kiwiPersonal` (monthly)
- Government contribution is stored as yearly and divided by 12 in all calculations
- Contributions are included in both `projectNetWorth` and `projectInvestment`

### Scenarios
- Sliders adjust income/expenses/growth rates per item
- "What If" temp items for hypothetical income/expense/debt/investment/lump sums
- Extra debt payments and investment contributions allocated from surplus
- Budget balance bar tracks allocated vs available surplus

## Conventions

- **Components**: PascalCase `.jsx`, default exports
- **Utils**: camelCase `.js`, named exports
- **Currency**: NZD formatting via `formatCurrency()` — no decimals by default
- **IDs**: Timestamp-based via `generateId()`
- **Frequency conversion**: `toMonthly(amount, frequency)` handles weekly/fortnightly/monthly/quarterly/yearly
- **Styling**: Tailwind only. Primary blue (`primary-600`), green for positive, red for negative/errors, amber for warnings
- **Cards**: `bg-white rounded-lg shadow-sm p-4`

## Data Model

- **Income**: `{ id, name, person, amount, frequency, startDate, endDate }`
- **Bills**: `{ id, name, amount, frequency, category }`
- **Assets**: `{ id, name, type, value, growthRate, startDate, kiwiGovt?, kiwiEmployer?, kiwiPersonal? }`
- **Liabilities**: `{ id, name, type, balance, interestRate, minPayment, paymentFrequency }`
- **Goals**: `{ id, name, targetAmount, currentAmount, deadline, monthlyContribution, isExpense }`

Asset types: `property`, `stock`, `savings`, `crypto`, `kiwisaver`, `other`
