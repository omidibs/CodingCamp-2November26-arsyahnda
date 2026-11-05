# Implementation Plan: Todo Life Dashboard

## Overview

Implement a zero-dependency, client-side single-page application using HTML5, CSS3, and Vanilla JavaScript (ES2020+). The app is organized as a single IIFE in `app.js` with four widget modules and a shared storage service. Tests use Vitest (jsdom) and fast-check for property-based testing.

## Tasks

- [x] 1. Set up project structure and shared infrastructure
  - Create `index.html` shell file that loads `styles.css` and `app.js` via `<link>` and `<script>` tags (no inline styles or scripts)
  - Create empty `styles.css` and `app.js` stub files
  - Create `package.json` with Vitest and fast-check as dev dependencies, plus a `test` script
  - Create `vitest.config.js` configured with jsdom environment
  - Define the top-level IIFE skeleton in `app.js` with a `DOMContentLoaded` handler that calls each widget's `init()`
  - _Requirements: 11.2, 11.3_

- [x] 2. Implement StorageService
  - [x] 2.1 Implement StorageService module
    - Write `load(key)`: wraps `localStorage.getItem`, JSON-parses the result, returns `null` on missing key or parse error
    - Write `save(key, value)`: JSON-stringifies and calls `localStorage.setItem`, silently catches `QuotaExceededError`
    - Write `remove(key)`: calls `localStorage.removeItem`
    - _Requirements: 7.3, 10.3_


- [x] 3. Implement shared validation helpers and data model utilities
  - [x] 3.1 Implement validation helpers
    - Write `validateTaskDescription(raw, existingTasks?, excludeId?)`: trims, rejects empty or > 500 chars; if `existingTasks` provided, rejects if trimmed lowercase value matches any task's description (excluding the task identified by `excludeId`); returns `{ ok, value, error }`
    - Write `validateLinkUrl(raw)`: checks `http://` or `https://` prefix, returns `{ ok, error }`
    - Write `validateLinkLabel(raw)`: trims, rejects empty, returns `{ ok, value, error }`
    - Write `validateUserName(raw)`: trims, rejects empty or > 100 characters, returns `{ ok, value, error }`
    - Write `generateId()`: returns `crypto.randomUUID()` with `Date.now() + Math.random()` fallback
    - _Requirements: 3.2, 3.4, 3.6, 4.4, 4.6, 8.3, 8.4, 14.1, 14.2, 14.3, 14.4, 15.6, 15.7_


- [ ] 4. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement ThemeWidget
  - [ ] 5.1 Implement ThemeWidget module
    - Write `ThemeWidget.init()`: synchronously reads `tld_theme` from `StorageService.load('tld_theme')`; defaults to `'light'` if absent or unrecognised; sets `document.documentElement.setAttribute('data-theme', theme)`; registers click listener on the theme toggle control
    - Write `ThemeWidget.toggle()`: flips in-memory theme between `'light'` and `'dark'`; calls `StorageService.save('tld_theme', theme)`; updates `data-theme` on `<html>`
    - Call `ThemeWidget.init()` as the **first** call inside the `DOMContentLoaded` handler in `app.js` (before any other widget) to prevent flash-of-wrong-theme
    - Add a `#theme-toggle` button element to `index.html`
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_


- [x] 6. Implement GreetingWidget
  - [x] 6.1 Implement `computeGreeting(hour, name?)` pure function and GreetingWidget
    - Write `computeGreeting(hour, name?)`: maps hour ranges 5–11 → "Good Morning", 12–17 → "Good Afternoon", 18–20 → "Good Evening", 21–23 | 0–4 → "Good Night"; if `name` is provided (non-empty string after trim), returns `"[greeting], [name]!"`, otherwise returns the greeting string alone
    - Write `GreetingWidget.init()`: reads current `Date`; renders time (HH:MM 24-hour format), full date string ("Weekday, Month Day, Year"), and greeting; starts `setInterval` every 60 000 ms; loads `tld_username` from storage and if present passes it to `computeGreeting`; registers Save and Clear control event listeners
    - Implement **Save** control: validates via `validateUserName`, persists to `tld_username`, re-renders greeting immediately without page reload
    - Implement **Clear** control: calls `StorageService.remove('tld_username')`, re-renders greeting in name-less format immediately without page reload
    - Add HTML elements to `index.html`: `#greeting`, `#time`, `#date`, `#name-input` (text input), `#btn-save-name` (Save control), `#btn-clear-name` (Clear control)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_


- [x] 7. Implement FocusTimerWidget
  - [x] 7.1 Implement FocusTimerWidget state machine and UI
    - Define state object `{ phase, remainingSeconds, intervalId }`; initialize to `{ phase: 'IDLE', remainingSeconds: 1500, intervalId: null }`
    - Implement `start()`: ignores if RUNNING or DONE; sets phase to RUNNING; starts `setInterval` decrementing by 1 per second; on reaching 0 clears interval, sets phase to DONE, applies visual indicator
    - Implement `stop()`: clears interval; sets phase to PAUSED
    - Implement `reset()`: clears interval; sets phase to IDLE; sets `remainingSeconds` to 1500; re-renders 25:00; removes done indicator
    - Register DOM event listeners for Start, Stop, Reset controls in `init()`
    - Add timer HTML (`#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`) to `index.html`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_


- [ ] 8. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement TodoWidget — core CRUD
  - [x] 9.1 Implement `addTask` and initial render
    - Write `addTask(description)`: validates via `validateTaskDescription(description, tasks)` to include duplicate detection; creates a `Task` object with `id`, `description`, `completed: false`, `createdAt`; appends to in-memory array; calls `StorageService.save('tld_todos', tasks)`; calls `renderList()`; clears input field; displays inline error message on validation failure (including "Task already exists")
    - Write `renderList()`: clears container; maps task array to DOM elements (checkbox, label, Edit button, Delete button)
    - In `init()`: load tasks from `StorageService.load('tld_todos')` (default `[]` on null); call `renderList()`; register Add control and Enter-key listeners
    - Add HTML for task input, Add button, and task list container to `index.html`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.1, 7.2, 7.3, 14.1, 14.2_


  - [x] 9.4 Implement `toggleTask` (mark complete/incomplete)
    - Write `toggleTask(id)`: flips `completed` on the matching task; saves to storage; calls `renderList()`
    - `renderList()` applies a distinct CSS class (e.g., `task--completed`) with at minimum strikethrough text for completed tasks
    - Register checkbox change listener in `renderList()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_


  - [x] 9.6 Implement `deleteTask`
    - Write `deleteTask(id)`: filters task from in-memory array; saves to storage; calls `renderList()`
    - Register Delete button click listener in `renderList()`
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 10. Implement TodoWidget — edit mode
  - [ ] 10.1 Implement `editTask` and edit-mode UI
    - Track `editingId: string | null` in widget state
    - When Edit button is clicked: if another task is in edit mode, cancel it (restore original display); replace clicked task's label with a pre-filled `<input>`; show Save and Cancel (Escape) controls; set `editingId`
    - Write `editTask(id, newDescription)`: validates via `validateTaskDescription(newDescription, tasks, id)` passing the task's own `id` as `excludeId` to allow self-save and reject cross-task duplicates; updates in-memory array; saves to storage; exits edit mode; calls `renderList()`; displays inline error on duplicate or validation failure
    - On Escape keydown in edit input: discard changes; call `renderList()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 14.3, 14.4, 14.5_


- [ ] 11. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement QuickLinksWidget
  - [ ] 12.1 Implement `addLink` and initial render
    - Write `addLink(label, url)`: validates label and URL; creates `Link` object with `id`, `label`, `url`; appends to in-memory array; saves to `StorageService.save('tld_links', links)`; calls `renderLinks()`
    - Write `renderLinks()`: clears container; maps link array to `<button>` elements with `target="_blank"` and `rel="noopener noreferrer"` anchor tags, plus a Delete button per link; displays an inline error on validation failure
    - In `init()`: load links from storage (default `[]`); call `renderLinks()`; register Add control listener
    - Add HTML for link label input, URL input, Add button, and links container to `index.html`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.1, 10.2, 10.3_

  - [ ] 12.3 Implement `deleteLink`
    - Write `deleteLink(id)`: filters link from in-memory array; saves to storage; calls `renderLinks()`
    - Register Delete button click listener in `renderLinks()`
    - _Requirements: 9.1, 9.2_


- [x] 13. Apply CSS layout, visual design, and theme tokens
  - [x] 13.1 Implement responsive layout, typographic scale, and theme color tokens in `styles.css`
    - Define a grid or flexbox layout that places all four widgets on one page with no horizontal scroll from 320 px to 1920 px
    - Set body text to minimum 14 px; apply a typographic scale where each heading level is ≥ 1.25× the size of the level below it
    - Define CSS custom properties for all color tokens under `:root` (Light_Theme defaults) and override them under `[data-theme="dark"]` so that no color values are set via JavaScript
    - Ensure both themes achieve a minimum 4.5:1 contrast ratio for all body text against the respective background (Req 13.7)
    - Add `.task--completed` style with `text-decoration: line-through` (and optionally muted color)
    - Add a distinct style for the timer DONE state (e.g., changed text color or "Session Complete" label visibility)
    - Add inline error message styles for validation feedback
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 13.7_

- [ ] 14. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use **fast-check** with a minimum of 100 iterations per property; tag each test with `// Feature: todo-life-dashboard, Property N`
- Unit tests use **Vitest** with jsdom environment
- All logic stays in the IIFE in `app.js`; pure functions (validators, `computeGreeting`, state machine transitions) should be exported or extracted so Vitest can import them directly
- The timer state is intentionally not persisted — it resets to 25:00 on every page load
- `crypto.randomUUID()` fallback: `Date.now().toString() + Math.random()`
- `ThemeWidget.init()` MUST be the first widget initialized (before GreetingWidget and others) to prevent a flash-of-wrong-theme on load
- `validateTaskDescription` is extended with optional `existingTasks` and `excludeId` parameters — pass `tasks` array in `addTask` and both `tasks` and the task's own `id` in `editTask`
- `computeGreeting` is extended with an optional `name` parameter; all existing call sites that omit the name continue to work unchanged

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "3.2", "3.3", "3.4", "3.5", "5.1"] },
    { "id": 2, "tasks": ["5.2", "5.3", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "6.4", "7.1"] },
    { "id": 4, "tasks": ["7.2", "7.3", "7.4", "9.1"] },
    { "id": 5, "tasks": ["9.2", "9.3", "9.4"] },
    { "id": 6, "tasks": ["9.5", "9.6", "10.1"] },
    { "id": 7, "tasks": ["9.7", "10.2", "10.3", "10.4", "12.1"] },
    { "id": 8, "tasks": ["12.2", "12.3"] },
    { "id": 9, "tasks": ["12.4", "13.1"] }
  ]
}
```
