# Requirements Document

## Introduction

The Todo Life Dashboard is a standalone, client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a single-page personal productivity hub that combines a time-aware greeting, a Pomodoro-style focus timer, a persistent to-do list, and a quick-links panel. All user data is stored in the browser's Local Storage — no backend or server is required. The application is designed to be opened directly in a modern browser or packaged as a browser extension.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Widget**: The UI component that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI component that implements a 25-minute countdown timer with Start, Stop, and Reset controls.
- **Todo_Manager**: The UI component that manages the creation, editing, completion, and deletion of task items.
- **Task**: A single to-do item consisting of a text description and a completion state.
- **QuickLinks_Panel**: The UI component that displays user-defined shortcut buttons that open external URLs.
- **Link**: A user-defined entry consisting of a label and a URL stored in the QuickLinks_Panel.
- **Local_Storage**: The browser's `window.localStorage` API used to persist all user data client-side.
- **Session**: A single browser tab instance of the Dashboard.
- **Theme_Toggle**: The UI control that switches the Dashboard between the light theme and the dark theme.
- **Light_Theme**: The visual theme in which the Dashboard uses a light background with dark foreground colors.
- **Dark_Theme**: The visual theme in which the Dashboard uses a dark background with light foreground colors.
- **User_Name**: The optional personal name entered by the user that is incorporated into the greeting message.

---

## Requirements

### Requirement 1: Time and Date Greeting

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the Dashboard, so that I immediately know when I am and feel welcomed.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 24-hour HH:MM format (HH: 00–23, MM: 00–59), updated every 60 seconds.
2. THE Greeting_Widget SHALL display the current local date in the format "Weekday, Month Day, Year" (e.g., "Monday, January 1, 2025"), including the full day of the week, full month name, numeric day, and four-digit year.
3. WHEN the local hour is between 05 and 11 inclusive, THE Greeting_Widget SHALL display the greeting "Good Morning".
4. WHEN the local hour is between 12 and 17 inclusive, THE Greeting_Widget SHALL display the greeting "Good Afternoon".
5. WHEN the local hour is between 18 and 20 inclusive, THE Greeting_Widget SHALL display the greeting "Good Evening".
6. WHEN the local hour is between 21 and 23 inclusive OR between 00 and 04 inclusive, THE Greeting_Widget SHALL display the greeting "Good Night".
7. WHEN the Dashboard loads, THE Greeting_Widget SHALL immediately display the current time, date, and greeting without requiring any user interaction.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialize with a countdown value of 25 minutes and 00 seconds (25:00) on page load.
2. WHEN the user activates the Start control, THE Focus_Timer SHALL begin decrementing the countdown by one second per second.
3. WHILE the Focus_Timer is running, THE Focus_Timer SHALL display the remaining time in MM:SS format.
4. WHEN the user activates the Stop control, THE Focus_Timer SHALL pause the countdown at the current remaining time, and a subsequent Start activation SHALL resume the countdown from that paused value.
5. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop the countdown regardless of whether it is running or paused, and restore the display to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a distinct visual indicator (such as a changed text color or an "Session Complete" label) that persists until the user activates Reset.
7. IF the user activates the Start control while the Focus_Timer is already running, THEN THE Focus_Timer SHALL ignore that activation and continue running without resetting.
8. IF the user activates the Start control when the countdown is at 00:00, THEN THE Focus_Timer SHALL ignore that activation until the user first activates Reset.

---

### Requirement 3: To-Do List — Add Tasks

**User Story:** As a user, I want to add new tasks to my to-do list, so that I can track things I need to do.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide a text input field and an Add control for entering new tasks.
2. WHEN the user submits a non-empty task description (between 1 and 500 characters after trimming whitespace) via the Add control or by pressing the Enter key, THE Todo_Manager SHALL append a new Task to the list with an initial completion state of incomplete.
3. WHEN a new Task is appended, THE Todo_Manager SHALL persist the updated task list to Local_Storage.
4. IF the user attempts to submit an empty or whitespace-only task description, THEN THE Todo_Manager SHALL reject the submission and leave the task list unchanged.
5. WHEN a new Task is appended, THE Todo_Manager SHALL clear the text input field.
6. IF the user attempts to submit a task description exceeding 500 characters, THEN THE Todo_Manager SHALL reject the submission and display an error message indicating the character limit has been exceeded.

---

### Requirement 4: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit the description of an existing task, so that I can correct or update it without deleting and re-adding it.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide an Edit control for each Task in the list.
2. WHEN the user activates the Edit control for a Task, THE Todo_Manager SHALL replace that Task's display text with an editable text field pre-filled with the current task description.
3. IF the user activates the Edit control for a second Task while another Task is already in edit mode, THEN THE Todo_Manager SHALL cancel the first edit (discarding any unsaved changes) and enter edit mode for the second Task.
4. WHEN the user confirms the edit by pressing Enter or activating a Save control, THE Todo_Manager SHALL update the Task description to the new non-empty value (between 1 and 500 characters after trimming whitespace).
5. WHEN the user confirms the edit, THE Todo_Manager SHALL persist the updated task list to Local_Storage.
6. IF the user attempts to confirm an edit with an empty or whitespace-only value, THEN THE Todo_Manager SHALL reject the save and retain the original task description.
7. WHEN the user cancels an edit by pressing Escape, THE Todo_Manager SHALL discard the change and restore the original task description display.

---

### Requirement 5: To-Do List — Mark Tasks as Done

**User Story:** As a user, I want to mark tasks as complete and visually distinguish them, so that I can track my progress.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide a completion toggle control for each Task.
2. WHEN the user activates the completion toggle for an incomplete Task, THE Todo_Manager SHALL mark that Task as complete and apply a distinct visual style that includes at minimum strikethrough text.
3. WHEN the user activates the completion toggle for a complete Task, THE Todo_Manager SHALL mark that Task as incomplete and remove the completed visual style.
4. WHEN the completion state of a Task changes, THE Todo_Manager SHALL persist the updated task list to Local_Storage.

---

### Requirement 6: To-Do List — Delete Tasks

**User Story:** As a user, I want to delete tasks I no longer need, so that my list stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Todo_Manager SHALL provide a Delete control for each Task in the list.
2. WHEN the user activates the Delete control for a Task, THE Todo_Manager SHALL immediately remove that Task from the list without requiring confirmation.
3. WHEN a Task is removed, THE Todo_Manager SHALL persist the updated task list to Local_Storage.

---

### Requirement 7: To-Do List — Persistence

**User Story:** As a user, I want my tasks to survive page reloads, so that I do not lose my list when I close or refresh the browser.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Todo_Manager SHALL read the task list from Local_Storage and render all previously saved Tasks.
2. IF no task data exists in Local_Storage, THEN THE Todo_Manager SHALL render an empty list without error.
3. IF the task data read from Local_Storage is malformed or unparseable, THEN THE Todo_Manager SHALL render an empty list and discard the malformed data without error.

---

### Requirement 8: Quick Links — Add and Display Links

**User Story:** As a user, I want to add shortcut buttons for my favorite websites, so that I can open them quickly from the Dashboard.

#### Acceptance Criteria

1. THE QuickLinks_Panel SHALL display each saved Link as a labeled button showing the Link's label text.
2. THE QuickLinks_Panel SHALL provide an input area for entering a Link label and a Link URL, and an Add control.
3. WHEN the user submits a non-empty label and a valid URL (beginning with `http://` or `https://`) via the Add control, THE QuickLinks_Panel SHALL add a new Link and persist the updated link list to Local_Storage.
4. IF the user attempts to submit with an empty label, an empty URL, or a URL that does not begin with `http://` or `https://`, THEN THE QuickLinks_Panel SHALL reject the submission, display an error message indicating the invalid field, and leave the link list unchanged.
5. WHEN the user activates a Link button, THE QuickLinks_Panel SHALL open the associated URL in a new browser tab.

---

### Requirement 9: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays organized.

#### Acceptance Criteria

1. THE QuickLinks_Panel SHALL provide a Delete control for each Link button.
2. WHEN the user activates the Delete control for a Link, THE QuickLinks_Panel SHALL remove that Link from the panel and persist the updated link list to Local_Storage.

---

### Requirement 10: Quick Links — Persistence

**User Story:** As a user, I want my quick links to survive page reloads, so that I do not have to re-add them every time.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE QuickLinks_Panel SHALL read the link list from Local_Storage and render all previously saved Links.
2. IF no link data exists in Local_Storage, THEN THE QuickLinks_Panel SHALL render an empty panel without error.
3. IF the link data read from Local_Storage is malformed or unparseable, THEN THE QuickLinks_Panel SHALL render an empty panel and discard the malformed data without error.

---

### Requirement 11: Layout and Visual Design

**User Story:** As a user, I want the Dashboard to have a clean, readable layout with clear visual hierarchy, so that I can find and use each feature without confusion.

#### Acceptance Criteria

1. THE Dashboard SHALL present all four widgets (Greeting_Widget, Focus_Timer, Todo_Manager, QuickLinks_Panel) on a single page without requiring navigation between pages.
2. THE Dashboard SHALL use a single external CSS file for all visual styling, with no inline styles or embedded style blocks applied to any element.
3. THE Dashboard SHALL use a single external JavaScript file for all application logic, with no inline scripts or embedded script blocks applied to any element.
4. THE Dashboard SHALL apply a typographic scale in which each heading level is at least 1.25× the font size of the text level immediately below it, and body text is no smaller than 14 px, so that headings, labels, and body text are distinguishable without relying on color alone.
5. THE Dashboard SHALL render all widgets on viewport widths from 320 px to 1920 px without horizontal scrolling, without any widget content being clipped or overlapping another widget, and with all text remaining at least 12 px in rendered size.

---

### Requirement 12: Performance and Compatibility

**User Story:** As a user, I want the Dashboard to load quickly and respond without noticeable lag, so that it does not interrupt my workflow.

#### Acceptance Criteria

1. THE Dashboard SHALL load and render all widgets without requiring a network request to any external server.
2. THE Dashboard SHALL complete initial render within 2 seconds when opened in any of the browsers listed in criterion 3 on a device with at least a 4-core CPU and 8 GB RAM, with no network throttling applied.
3. THE Dashboard SHALL operate correctly on the current stable releases of Chrome, Firefox, Edge, and Safari.
4. WHEN a user interaction triggers a Local_Storage read or write, THE Dashboard SHALL complete that operation and update the UI within 100 ms.
5. WHEN a user interaction does not involve a Local_Storage operation, THE Dashboard SHALL reflect the resulting UI change within 50 ms of the interaction event.

---

### Requirement 13: Light/Dark Mode Theme Toggle

**User Story:** As a user, I want to switch the Dashboard between a light theme and a dark theme, so that I can choose a visual style that suits my environment or preference.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Theme_Toggle control that is visible and accessible on all viewport widths from 320 px to 1920 px.
2. WHEN the user activates the Theme_Toggle while the Light_Theme is active, THE Dashboard SHALL apply the Dark_Theme to all Dashboard elements immediately without a page reload.
3. WHEN the user activates the Theme_Toggle while the Dark_Theme is active, THE Dashboard SHALL apply the Light_Theme to all Dashboard elements immediately without a page reload.
4. WHEN the user activates the Theme_Toggle, THE Dashboard SHALL persist the selected theme identifier to Local_Storage.
5. WHEN the Dashboard loads and a theme identifier is present in Local_Storage, THE Dashboard SHALL apply the stored theme before rendering any visible content, so that no flash of the opposite theme occurs.
6. IF no theme identifier is present in Local_Storage when the Dashboard loads, THEN THE Dashboard SHALL apply the Light_Theme as the default.
7. THE Dark_Theme SHALL use a background color with a luminance sufficient to distinguish it from the Light_Theme background, and all body text in each theme SHALL maintain a contrast ratio of at least 4.5:1 against its respective background color.

---

### Requirement 14: Prevent Duplicate Tasks

**User Story:** As a user, I want the Dashboard to prevent me from adding or saving duplicate tasks, so that my to-do list does not contain redundant entries.

#### Acceptance Criteria

1. WHEN the user submits a new task description, THE Todo_Manager SHALL compare the trimmed submission against the trimmed description of every existing Task using a case-insensitive comparison.
2. IF the trimmed, case-insensitive submission matches the trimmed, case-insensitive description of any existing Task, THEN THE Todo_Manager SHALL reject the submission, display an error message stating that the task already exists, and leave the task list unchanged.
3. WHEN the user confirms an edit for a Task, THE Todo_Manager SHALL compare the trimmed new description against the trimmed description of every other Task (excluding the Task being edited) using a case-insensitive comparison.
4. IF the trimmed, case-insensitive new description matches the trimmed, case-insensitive description of any other Task, THEN THE Todo_Manager SHALL reject the save, display an error message stating that the task already exists, and retain the Task's original description.
5. IF the trimmed, case-insensitive new description entered during an edit matches the Task's own current description, THEN THE Todo_Manager SHALL accept the save without treating it as a duplicate.

---

### Requirement 15: Custom Name in Greeting

**User Story:** As a user, I want to enter my name so that the greeting is personalised with my name, and have that name remembered across page loads.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL provide a control that allows the user to enter or edit a User_Name at any time.
2. WHEN the user saves a non-empty User_Name (between 1 and 100 characters after trimming whitespace), THE Greeting_Widget SHALL persist the User_Name to Local_Storage and update the greeting to the format "[Greeting], [User_Name]!" (e.g., "Good Morning, Alex!") immediately without a page reload.
3. WHEN the Dashboard loads and a User_Name is present in Local_Storage, THE Greeting_Widget SHALL display the greeting in the format "[Greeting], [User_Name]!".
4. IF no User_Name is present in Local_Storage when the Dashboard loads, THEN THE Greeting_Widget SHALL display the greeting without a name (e.g., "Good Morning"), preserving the existing behavior defined in Requirement 1.
5. THE Greeting_Widget SHALL provide a Clear control that removes the stored User_Name from Local_Storage and reverts the greeting to the name-less format immediately without a page reload.
6. IF the user attempts to save a User_Name exceeding 100 characters, THEN THE Greeting_Widget SHALL reject the input and display an error message indicating the character limit.
7. IF the user attempts to save an empty or whitespace-only User_Name, THEN THE Greeting_Widget SHALL reject the input and leave the currently stored User_Name unchanged.
