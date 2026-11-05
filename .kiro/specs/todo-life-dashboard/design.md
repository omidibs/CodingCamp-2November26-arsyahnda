# Design Document

## Overview

The Todo Life Dashboard is a zero-dependency, client-side single-page application (SPA) built with HTML5, CSS3, and Vanilla JavaScript (ES2020+). It runs entirely in the browser — no build step, no backend, no CDN dependencies. All persistent state lives in `window.localStorage`.

The application is a personal productivity hub composed of four independent widgets that coexist on one page:

| Widget | Responsibility |
|---|---|
| Greeting_Widget | Displays current time, date, a time-of-day greeting, and optional personalised name |
| Focus_Timer | Pomodoro-style 25-minute countdown timer |
| Todo_Manager | Full CRUD task list with duplicate-prevention, persisted to Local Storage |
| QuickLinks_Panel | User-defined URL shortcut buttons persisted to Local Storage |

**Key design principles:**
- Single HTML file, one external CSS file, one external JavaScript file (Req 11.2, 11.3)
- All logic is pure where possible — widgets own their state; the storage layer is a thin wrapper
- No frameworks, no transpilers; the file can be opened with `file://` or served from any static host
- Theme is driven entirely by a `data-theme` attribute on `<html>` and CSS custom properties — no JavaScript color manipulation
- Duplicate-task detection is performed inside the validation layer so no widget needs to implement it directly

---

## Architecture

### Module Structure

```
index.html          ← shell; loads styles.css and app.js
styles.css          ← all visual styling (no inline styles)
app.js              ← all application logic (no inline scripts)
```

`app.js` is organized as an IIFE (Immediately Invoked Function Expression) with four widget modules and one shared storage module. Each widget module exposes an `init()` function called from a top-level `DOMContentLoaded` handler.

```
app.js
├── StorageService       ← thin localStorage wrapper (get/set/remove, JSON parse/stringify)
├── ThemeWidget          ← reads/writes tld_theme; toggles data-theme on <html>
├── GreetingWidget       ← time/date/greeting display + interval tick + name personalisation
├── FocusTimerWidget     ← countdown state machine + UI updates
├── TodoWidget           ← task CRUD with duplicate detection, validation, rendering
└── QuickLinksWidget     ← link CRUD, validation, rendering
```

### Lifecycle

```mermaid
sequenceDiagram
    participant Browser
    participant DOMContentLoaded
    participant StorageService
    participant Widgets

    Browser->>DOMContentLoaded: page load
    DOMContentLoaded->>ThemeWidget: init() — reads tld_theme, sets data-theme before paint
    DOMContentLoaded->>GreetingWidget: init()
    GreetingWidget->>StorageService: load('tld_username')
    DOMContentLoaded->>FocusTimerWidget: init()
    DOMContentLoaded->>TodoWidget: init()
    TodoWidget->>StorageService: load('tld_todos')
    DOMContentLoaded->>QuickLinksWidget: init()
    QuickLinksWidget->>StorageService: load('tld_links')
    GreetingWidget->>Browser: setInterval(tick, 60 000 ms)
    FocusTimerWidget->>Browser: (idle; no interval yet)
```

### State Flow

Each widget maintains its own in-memory state object. State mutations always go through the pattern:

```
user action → validate → mutate in-memory state → persist to storage → re-render
```

No global mutable state is shared between widgets.

---

## Components and Interfaces

### StorageService

Provides a typed façade over `window.localStorage` so the rest of the app never calls localStorage directly.

```js
StorageService = {
  load(key: string): any | null,   // JSON.parse; returns null on error or missing key
  save(key: string, value: any): void,  // JSON.stringify; silent on QuotaExceededError
  remove(key: string): void
}
```

Storage keys used:

| Key | Value type | Owner |
|---|---|---|
| `tld_todos` | `Task[]` | TodoWidget |
| `tld_links` | `Link[]` | QuickLinksWidget |
| `tld_theme` | `'light' \| 'dark'` | ThemeWidget |
| `tld_username` | `string` | GreetingWidget |

### GreetingWidget

- Reads `Date` on init and every 60 seconds via `setInterval`.
- Computes greeting purely from the local hour (no network).
- On init, reads `tld_username` from storage; if present, formats greeting as `"[Greeting], [name]!"`.
- Provides a name input field with **Save** and **Clear** controls.
  - **Save**: validates the name (1–100 chars after trim), persists to `tld_username`, updates greeting immediately.
  - **Clear**: removes `tld_username` from storage, reverts greeting to name-less format immediately.

**Public interface:**
```js
GreetingWidget.init(): void
```

### ThemeWidget

Manages the light/dark theme by writing a `data-theme` attribute on the `<html>` element. CSS custom properties keyed off `[data-theme="dark"]` swap all color tokens, ensuring no JavaScript ever sets explicit colors.

Theme is initialized **synchronously before first paint** (called at the top of the `DOMContentLoaded` handler — or ideally in an inline `<script>` in `<head>`) to prevent a flash-of-wrong-theme.

State object:
```js
{
  theme: 'light' | 'dark'   // in-memory mirror of tld_theme
}
```

**Public interface:**
```js
ThemeWidget.init(): void  // reads tld_theme, applies data-theme, registers toggle listener
ThemeWidget.toggle(): void  // flips theme, persists, updates data-theme
```

CSS contrast requirement: both themes must achieve a minimum 4.5:1 contrast ratio for all body text against its background (Req 13.7).

### FocusTimerWidget

Implements a four-state finite state machine:

```
IDLE ──start──► RUNNING ──stop──► PAUSED ──start──► RUNNING
                    │                                   │
                  reset                               reset
                    ▼                                   ▼
                  IDLE                               IDLE
                RUNNING ──00:00──► DONE
                  DONE ──reset──► IDLE
```

State object:
```js
{
  phase: 'IDLE' | 'RUNNING' | 'PAUSED' | 'DONE',
  remainingSeconds: number,   // 0–1500
  intervalId: number | null
}
```

**Public interface:**
```js
FocusTimerWidget.init(): void
```

Controls (`start`, `stop`, `reset`) are handled by DOM event listeners registered in `init()`.

### TodoWidget

Manages an ordered list of `Task` objects. Edit mode is tracked in widget-local state as `editingId: string | null`.

**Public interface:**
```js
TodoWidget.init(): void
```

Internal operations:
- `addTask(description: string): Result`
- `editTask(id: string, newDescription: string): Result`
- `toggleTask(id: string): void`
- `deleteTask(id: string): void`
- `renderList(): void`

### QuickLinksWidget

Manages an ordered list of `Link` objects.

**Public interface:**
```js
QuickLinksWidget.init(): void
```

Internal operations:
- `addLink(label: string, url: string): Result`
- `deleteLink(id: string): void`
- `renderLinks(): void`

### Validation Helpers

Shared pure functions used by both TodoWidget and QuickLinksWidget:

```js
validateTaskDescription(raw: string, existingTasks?: Task[], excludeId?: string): { ok: boolean, value?: string, error?: string }
// trims whitespace; rejects empty or > 500 chars
// if existingTasks provided: rejects if trimmed value matches any task description
//   (case-insensitive) except the task identified by excludeId (for edit mode)

validateLinkUrl(raw: string): { ok: boolean, error?: string }
// checks prefix http:// or https://

validateLinkLabel(raw: string): { ok: boolean, value?: string, error?: string }
// trims whitespace; rejects empty

validateUserName(raw: string): { ok: boolean, value?: string, error?: string }
// trims whitespace; rejects empty or > 100 chars
```

**Duplicate detection logic** (`validateTaskDescription` extension):

```
trimmed = raw.trim().toLowerCase()
for each task in existingTasks (skip task.id === excludeId):
    if task.description.trim().toLowerCase() === trimmed → return failure("Task already exists")
```

This pure function signature allows TodoWidget's `addTask` and `editTask` to pass the current task array (and optionally the id being edited) without coupling the validation module to widget state.

---

## Data Models

### Task

```js
{
  id: string,           // crypto.randomUUID() or Date.now().toString() fallback
  description: string,  // 1–500 chars, trimmed
  completed: boolean,
  createdAt: number     // Date.now() timestamp; used for stable ordering
}
```

Stored in localStorage key `tld_todos` as a JSON array.

### Link

```js
{
  id: string,    // crypto.randomUUID() or Date.now().toString() fallback
  label: string, // non-empty, trimmed
  url: string    // must start with http:// or https://
}
```

Stored in localStorage key `tld_links` as a JSON array.

### Greeting Computation

Pure function — no stored state:

```js
function computeGreeting(hour: number, name?: string): string
// hour: 5–11  → "Good Morning"
// hour: 12–17 → "Good Afternoon"
// hour: 18–20 → "Good Evening"
// hour: 21–23 | 0–4 → "Good Night"
// if name (non-empty string after trim) is provided:
//   return "[greeting], [name]!"   e.g. "Good Morning, Alex!"
// otherwise return greeting only   e.g. "Good Morning"
```

### Theme State

Not a Task or Link — just a scalar string persisted as `tld_theme`.

```js
type Theme = 'light' | 'dark'
// Default: 'light'
// Applied as: document.documentElement.setAttribute('data-theme', theme)
```

CSS custom properties (defined in `styles.css`) respond to `[data-theme="dark"]` to swap all color tokens. No color values are set via JavaScript.

### User Name

Persisted as `tld_username` (plain string, not a JSON object).

```js
type UserName = string  // 1–100 chars after trim
// Absent from storage → greeting shows without name
// Present → computeGreeting receives it as the name argument
```

### Timer State

Not persisted. On page load the timer always resets to 25:00 (IDLE). Persisting timer state was intentionally excluded to keep the session model simple.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Greeting covers all 24 hours without gaps or overlaps

*For any* integer hour value in [0, 23], `computeGreeting(hour)` SHALL return exactly one of the four defined greeting strings and SHALL never return an undefined value or throw.

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Task addition grows the list by one

*For any* task list state and any non-empty, non-whitespace-only description of 1–500 characters (after trimming), calling `addTask` SHALL increase the task list length by exactly one and the new task SHALL appear at the end of the list with `completed = false`.

**Validates: Requirements 3.2**

---

### Property 3: Whitespace-only and empty task descriptions are always rejected

*For any* string composed entirely of whitespace characters (including the empty string), calling `addTask` or `editTask` with that string SHALL return a failure result and leave the task list unchanged.

**Validates: Requirements 3.4, 4.6**

---

### Property 4: Task description over-length is always rejected

*For any* string whose length after trimming exceeds 500 characters, calling `addTask` or `editTask` SHALL return a failure result and leave the task list unchanged.

**Validates: Requirements 3.6, 4.4**

---

### Property 5: Task persistence round-trip

*For any* non-empty list of `Task` objects, serializing the list to localStorage via `StorageService.save` then deserializing it via `StorageService.load` SHALL produce a list that is structurally equal to the original (same ids, descriptions, completion states, and order).

**Validates: Requirements 3.3, 4.5, 5.4, 6.3, 7.1**

---

### Property 6: Completion toggle is its own inverse

*For any* task in the list, toggling its completion state twice SHALL leave `completed` equal to its original value, and the task list length SHALL remain unchanged.

**Validates: Requirements 5.2, 5.3**

---

### Property 7: Task deletion reduces list length by one

*For any* task list with at least one task, deleting a task by its id SHALL reduce the list length by exactly one and SHALL remove the task with that id from the list, leaving all other tasks unchanged.

**Validates: Requirements 6.2**

---

### Property 8: Link addition grows the panel by one

*For any* link list state and any combination of a non-empty label and a URL starting with `http://` or `https://`, calling `addLink` SHALL increase the link list length by exactly one and the new link SHALL appear at the end.

**Validates: Requirements 8.3**

---

### Property 9: Invalid link submissions are always rejected

*For any* submission where the label is empty, the URL is empty, or the URL does not start with `http://` or `https://`, calling `addLink` SHALL return a failure result and leave the link list unchanged.

**Validates: Requirements 8.4**

---

### Property 10: Link persistence round-trip

*For any* non-empty list of `Link` objects, serializing then deserializing via `StorageService` SHALL produce a list structurally equal to the original (same ids, labels, URLs, and order).

**Validates: Requirements 10.1**

---

### Property 11: Link deletion reduces panel by one

*For any* link list with at least one link, deleting a link by its id SHALL reduce the list length by exactly one and SHALL remove the link with that id, leaving all other links unchanged.

**Validates: Requirements 9.2**

---

### Property 12: Timer state machine — start is idempotent when running

*For any* timer in RUNNING phase with any remaining seconds > 0, calling the start action SHALL leave the phase as RUNNING and the remaining seconds unchanged.

**Validates: Requirements 2.7**

---

### Property 13: Timer state machine — reset always returns to IDLE at 1500 s

*For any* timer in any phase (IDLE, RUNNING, PAUSED, DONE) and any remaining seconds value, calling the reset action SHALL set phase to IDLE and remainingSeconds to 1500.

**Validates: Requirements 2.5**

---

### Property 14: Theme toggle is its own inverse

*For any* starting theme (`'light'` or `'dark'`), activating the Theme_Toggle twice SHALL return the active theme to its original value, and the theme persisted in Local Storage SHALL equal the theme currently applied to the document.

**Validates: Requirements 13.2, 13.3, 13.4**

---

### Property 15: Duplicate task addition is always rejected

*For any* task list with at least one task and any string whose trimmed, lowercased value matches the trimmed, lowercased description of an existing task, calling `addTask` with that string SHALL return a failure result and leave the task list unchanged.

**Validates: Requirements 14.1, 14.2**

---

### Property 16: Duplicate task edit is always rejected (cross-task)

*For any* task list with at least two tasks, editing one task to give it the same trimmed, case-insensitive description as any other task SHALL return a failure result, leaving the edited task's description unchanged and the task list length unchanged.

**Validates: Requirements 14.3, 14.4**

---

### Property 17: Editing a task with its own description always succeeds

*For any* task in the list, calling `editTask` with a string whose trimmed, case-insensitive value equals the task's own current trimmed, case-insensitive description SHALL succeed (not be rejected as a duplicate) and the task SHALL retain the (possibly re-cased) saved description.

**Validates: Requirements 14.5**

---

### Property 18: computeGreeting with a valid name always produces the correct format

*For any* integer hour in [0, 23] and any name string of 1–100 characters after trimming, `computeGreeting(hour, name)` SHALL return a string of the form `"[greeting], [name]!"` where `[greeting]` is one of the four defined greeting strings and `[name]` equals the trimmed name.

**Validates: Requirements 15.2, 15.3**

---

### Property 19: User name validation rejects all invalid inputs

*For any* string that is either empty, composed entirely of whitespace, or whose trimmed length exceeds 100 characters, `validateUserName` SHALL return a failure result, leaving any previously stored name unchanged.

**Validates: Requirements 15.6, 15.7**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` read returns malformed JSON | `StorageService.load` catches `JSON.parse` errors, returns `null`; widget renders empty state (Req 7.3, 10.3) |
| `localStorage` write throws `QuotaExceededError` | `StorageService.save` catches the error silently; in-memory state remains valid |
| `crypto.randomUUID` unavailable (very old browser) | Fall back to `Date.now().toString() + Math.random()` for id generation |
| Task/link validation failure | Widget displays an inline error message adjacent to the offending field; submission is blocked |
| Edit cancelled via Escape | Widget discards in-memory edit buffer; re-renders original description; no storage write |
| Second edit activated while one is open | Widget commits a cancel on the first edit (no save), then enters edit mode for the second task (Req 4.3) |
| Timer reaches 00:00 | `clearInterval` is called; phase set to DONE; visual indicator applied; start button is inert (Req 2.6, 2.8) |
| Duplicate task submission (add or edit) | `validateTaskDescription` returns failure with "Task already exists" message; task list unchanged (Req 14.2, 14.4) |
| `tld_theme` contains an unrecognised value in storage | `ThemeWidget.init` treats it as absent; applies Light_Theme default |
| `tld_username` is missing from storage on load | `GreetingWidget.init` renders greeting without a name; no error |
| User name save with empty or whitespace-only input | `validateUserName` returns failure; existing stored name is left unchanged (Req 15.7) |
| User name save exceeds 100 characters | `validateUserName` returns failure with character-limit error; existing stored name unchanged (Req 15.6) |
| Theme toggle before `ThemeWidget.init` runs | Not possible; `ThemeWidget.init` is the first call in `DOMContentLoaded` |

---

## Testing Strategy

### Overview

The application has no build step, so tests use a browser-compatible test harness. The recommended approach is **Vitest** (with jsdom environment) for unit and property-based tests, since it requires zero configuration beyond a `package.json` and can import the `app.js` module directly if it is refactored to export its internal functions.

Alternatively, pure functions (validators, `computeGreeting`, state machine transitions) can be tested in isolation by extracting them into a separate `lib.js` module.

### Unit Tests (example-based)

Cover specific scenarios and edge cases that complement the property tests:

| Test | Requirement |
|---|---|
| Timer displays `25:00` on init | 2.1 |
| Timer RUNNING → PAUSED → RUNNING resumes from paused value | 2.4 |
| Timer in DONE state ignores start | 2.8 |
| `computeGreeting(5)` → "Good Morning" | 1.3 |
| `computeGreeting(12)` → "Good Afternoon" | 1.4 |
| `computeGreeting(18)` → "Good Evening" | 1.5 |
| `computeGreeting(0)` → "Good Night" | 1.6 |
| `computeGreeting(9, 'Alex')` → "Good Morning, Alex!" | 15.2 |
| `computeGreeting(14, undefined)` → "Good Afternoon" (no name) | 15.4 |
| Adding a task clears the input field | 3.5 |
| Edit mode cancelled via Escape restores original text | 4.7 |
| Opening a second edit cancels first | 4.3 |
| Submitting a task description that duplicates an existing task (same case) is rejected | 14.2 |
| Submitting a task description that duplicates an existing task (different case) is rejected | 14.1 |
| Editing a task to match another task's description is rejected | 14.4 |
| Editing a task with its own description (different case) is accepted | 14.5 |
| Link button opens URL in new tab (`target="_blank"`) | 8.5 |
| `StorageService.load` with malformed JSON returns null | 7.3, 10.3 |
| `StorageService.load` with missing key returns null | 7.2, 10.2 |
| Theme defaults to light when `tld_theme` absent | 13.6 |
| Theme applies stored `'dark'` value on load without flash | 13.5 |
| `validateUserName('')` → failure | 15.7 |
| `validateUserName('   ')` → failure | 15.7 |
| `validateUserName('x'.repeat(101))` → failure | 15.6 |
| Clear control removes name and reverts greeting format | 15.5 |

### Property-Based Tests

Use **fast-check** (JavaScript) as the property-based testing library. Each test runs a minimum of **100 iterations**.

Each test is tagged with a comment:
```
// Feature: todo-life-dashboard, Property N: <property text>
```

| Property | fast-check Generators | What is verified |
|---|---|---|
| P1: Greeting covers all hours | `fc.integer({ min: 0, max: 23 })` | Returns one of four strings; never undefined/throws |
| P2: Task addition grows list by one | `fc.array(taskArb)` + `fc.string({ minLength: 1, maxLength: 500 })` filtered non-whitespace | List length +1; new task at end; completed = false |
| P3: Whitespace/empty rejected | `fc.stringMatching(/^\s*$/)` | Returns failure; list unchanged |
| P4: Over-length rejected | `fc.string({ minLength: 501 })` | Returns failure; list unchanged |
| P5: Task persistence round-trip | `fc.array(taskArb)` | `load(save(tasks))` ≡ tasks |
| P6: Toggle is its own inverse | `fc.array(taskArb, { minLength: 1 })` + `fc.nat()` (index) | Double-toggle restores original `completed` |
| P7: Deletion reduces list by one | `fc.array(taskArb, { minLength: 1 })` + `fc.nat()` (index) | Length −1; id no longer in list |
| P8: Link addition grows list by one | `fc.array(linkArb)` + `fc.tuple(labelArb, urlArb)` | List length +1; new link at end |
| P9: Invalid link rejected | `fc.oneof(emptyLabelArb, badUrlArb)` | Returns failure; list unchanged |
| P10: Link persistence round-trip | `fc.array(linkArb)` | `load(save(links))` ≡ links |
| P11: Link deletion reduces list by one | `fc.array(linkArb, { minLength: 1 })` + `fc.nat()` (index) | Length −1; id no longer in list |
| P12: Start idempotent when running | `fc.integer({ min: 1, max: 1500 })` | Phase stays RUNNING; seconds unchanged |
| P13: Reset always returns to IDLE/1500 | `fc.constantFrom('IDLE','RUNNING','PAUSED','DONE')` + `fc.integer({ min: 0, max: 1500 })` | Phase = IDLE; remainingSeconds = 1500 |
| P14: Theme toggle is its own inverse | `fc.constantFrom('light','dark')` | Toggle twice restores original theme; storage equals applied theme |
| P15: Duplicate add always rejected | `fc.array(taskArb, { minLength: 1 })` + index picker + case-variant generator | Returns failure; list length unchanged |
| P16: Duplicate edit always rejected (cross-task) | `fc.array(taskArb, { minLength: 2 })` + two distinct index pickers + case-variant | Returns failure; edited task description unchanged |
| P17: Self-description edit always accepted | `fc.array(taskArb, { minLength: 1 })` + index picker + `fc.string()` mapped to case-variants of own description | Returns success; task description updated |
| P18: computeGreeting with name always formats correctly | `fc.integer({ min: 0, max: 23 })` + `fc.string({ minLength: 1, maxLength: 100 })` filtered non-whitespace | Returns `"[greeting], [trimmedName]!"` |
| P19: validateUserName rejects all invalid inputs | `fc.oneof(fc.constant(''), fc.stringMatching(/^\s+$/), fc.string({ minLength: 101 }))` | Returns failure |

### Integration / Smoke Tests

These exercise the full widget lifecycle against a jsdom DOM:

- Dashboard loads and all four widget containers are present in the DOM
- Task added via Enter key appears in the rendered list
- Completed task has the `--completed` CSS modifier class
- Quick link button has `target="_blank"` and `rel="noopener noreferrer"`
- Persisted tasks survive a simulated page reload (re-call `TodoWidget.init()` with same storage)
- Persisted links survive a simulated page reload
- Theme_Toggle control is present in the DOM at any viewport
- Pre-seeding `tld_theme="dark"` in storage before `ThemeWidget.init()` results in `data-theme="dark"` on `<html>`
- Calling `ThemeWidget.toggle()` updates both `data-theme` on `<html>` and `tld_theme` in storage consistently
- Pre-seeding `tld_username="Alex"` in storage before `GreetingWidget.init()` results in greeting containing "Alex"
- Calling the Clear control removes `tld_username` from storage and removes the name from the rendered greeting

### Responsive / Visual

Manual checks at 320 px, 768 px, and 1920 px viewport widths to verify no horizontal scroll and no widget overlap (Req 11.5). Automated screenshot diffing with a tool like Playwright can supplement these checks.
