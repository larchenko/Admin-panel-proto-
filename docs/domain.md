# Domain and scope

Status: draft, 2026-09-20. Phase 0 of the back-office prototype.

## What we are building

An HTML prototype of the **back office** (admin panel) for a structured-products
management system. The system itself has a separate end-user interface, delivered
as its own service. The back office is where staff manage the entities that the
end-user service consumes.

The prototype borrows the shadcn/ui design language. Production frontend is
Spartan UI (Angular). See `docs/decisions.md` (to be created in Phase 1).

## Entities

Four top-level areas, as confirmed by the product owner:

| Area | What it holds | Notes / to confirm |
|---|---|---|
| Instruments | Financial instruments the products are built on | Fields, groups and the list view are defined in `instruments.md` |
| Users & Organizations | Who has access, and which organization they belong to | Relationship user ↔ organization to be defined (one or many) |
| Products | Structured products | Product types, statuses and link to instruments to be defined |
| Settings | System-wide configuration | Which settings are editable from the back office to be defined |

Only the area names are confirmed. Fields, relationships and states are open
and will be captured per entity before its screens are designed (Phase 5).

## Users and roles

One role for now: **Master Admin**. Full access to all four areas.
No permission matrix in this iteration. Screens do not need a "no access" state,
but the kit will still include it for later.

## Decisions fixed in Phase 0

- Interface language: **English**.
- Theme: **light only**. No dark theme.
- Authentication: **out of scope**. No login screen, no SSO. The prototype
  opens directly on the app shell.
- Icons: **RemixIcon**.

## Key scenarios (draft, to confirm)

Written for a generic entity. Each area will get its own version later.

1. Find an entity in a list: search, filter, sort, paginate.
2. Open an entity and read its details.
3. Create a new entity with validation.
4. Edit an existing entity.
5. Deactivate or delete an entity with confirmation.
6. Change a system setting.

## Open questions

Instruments are answered in `instruments.md`; what follows is the rest.

- Products: which statuses exist across the lifecycle?
- Products ↔ Instruments: one product references one or many instruments?
- Users ↔ Organizations: can a user belong to several organizations?
- Organizations: are these issuers, distributors, clients, or all of them?
- Settings: a flat list, or grouped into sections?
- Do any entities need an audit trail or history view in this iteration?
