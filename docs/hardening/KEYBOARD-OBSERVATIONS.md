# PR-00 keyboard and browser observations

Session date: 2026-11-17. Source: upstream `233dd7f`, PR-00 test-only work branch. All accounts/data were synthetic. These are specific observations, not a full WCAG or workflow acceptance claim.

## Manual browser-control checks performed

| View / action | Observed result | Limitation |
| --- | --- | --- |
| Login at 1280×720: fill labeled Email kantor and Password, submit with Enter | Button becomes `Memverifikasi…` then browser reaches `/overview`; synthetic owner authenticated | Filling used semantic browser controls; complete Tab-order audit not performed |
| Overview desktop: Ctrl+K | `Pencarian global` dialog opens; `Cari global` textbox is active | Does not prove focus trapping or restoration |
| Search dialog: Escape | Dialog count becomes zero | Focus-restoration correctness still requires dedicated acceptance |
| Overview at 390×844: Enter on `Buka menu` | `Menu navigasi` dialog opens with all module links | Immediate snapshot shows topbar toggle still active outside the dialog; investigate focus management in PR-08 |

## Additional visible claim evidence

Login DOM snapshot visibly renders `Dipercaya 120+ agency & studio di Indonesia`, `Koneksi terenkripsi AES-256 · SSO siap pakai`, and a fixed `Kreatif Nusantara` workspace name. These are recorded under A10's addendum in [AUDIT-EVIDENCE.md](AUDIT-EVIDENCE.md). Visibility is verified; customer-count, encryption and SSO assertions are not independently substantiated by this baseline.

## Automated route checks

`e2e/hardening-baseline.spec.ts` recorded one Tab focus observation and verified Ctrl+K focus + Escape dismissal on each of eight authenticated list/dashboard routes at all three widths. The successful final run produced **30 PNGs** across all ten routes, three passed viewport tests, and zero captured console errors. Login and campaign-detail screenshots are included; those two routes do not receive the same shortcut loop. These checks do not substitute for manual traversal of every form, table, Kanban movement, calendar, modal and finance-record action.

**P0-04 remains partially open** until all ten routes receive a full manual keyboard walk at the specified widths and the captured layouts are reviewed. Critical-action accessibility gate P3-07 also remains open. Any console error or failing route capture must be logged separately and cannot be counted as passed.
