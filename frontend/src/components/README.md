# Components

- **`shared/`** — Layout, navigation, and UI used across multiple pages (e.g. `Layout`, `Navbar`, `CashFlowSummaryCard`). Import from `components/shared` or `components/shared/<Name>`.
- Add **feature folders** (e.g. `expenses/`, `categories/`) when extracting page-specific pieces (e.g. `ExpenseTableRow`, `CategoryRow`) to keep pages thin.
- Add **`ui/`** later if you introduce generic primitives (Button, Modal, Input) that are reused and not app-domain-specific.
