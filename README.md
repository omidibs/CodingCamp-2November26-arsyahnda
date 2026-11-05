# Todo Life Dashboard — CodingCamp-2November26-arsyahnda

A standalone, zero-dependency personal productivity dashboard built with **Vanilla HTML5, CSS3, and Pure JavaScript**. Designed using **Kiro** spec-driven development, with all user data persisted locally in `window.localStorage`.

---

## ✨ Features

### 🚀 Core Features (MVP)

- **Dynamic Greeting & Clock**
  - Live digital clock showing the current local time (`HH:MM` 24-hour format) and full date (`Weekday, Month Day, Year`).
  - Context-aware greeting that adapts automatically based on the time of day (`Good Morning`, `Good Afternoon`, `Good Evening`, `Good Night`).
- **Focus Timer (Pomodoro)**
  - Default 25-minute (`25:00`) countdown focus timer.
  - Intuitive controls: **Start**, **Stop (Pause)**, and **Reset**, plus a visual **Session Complete** indicator when reaching `00:00`.
- **To-Do List (Full CRUD & Persistence)**
  - **Create**: Add new tasks via the Add button or `Enter` key (1–500 characters).
  - **Read**: Display all active and completed tasks.
  - **Update**: Inline edit mode (`Edit`, `Save` / `Enter`, `Cancel` / `Escape`) for task descriptions and checkbox toggle for completion status (`done` / `not done` with strikethrough styling).
  - **Delete**: Immediately remove individual tasks.
  - **Local Storage**: All task data persists client-side (`tld_todos`) across browser reloads.
- **Quick Links**
  - Bookmarks panel allowing users to save (`Label` + `http://` or `https://` URL), launch (in a new tab with `target="_blank" rel="noopener noreferrer"`), and delete their favorite websites.
  - Stored in browser `localStorage` (`tld_links`).

---

### ‼️ Challenges / Extra Features (Select 3)

Customize and mark the 3 implemented challenges (matching `.kiro/specs/todo-life-dashboard`):

- [x] **Light / Dark Mode**: Toggle between light and dark themes (`data-theme="light"` / `data-theme="dark"`) with preference saved in `localStorage` (`tld_theme`).
- [x] **Custom Name in Greeting**: Personalized greeting name (`"[Greeting], [Name]!"`) stored in `localStorage` (`tld_username`) and editable/clearable by the user at any time.
- [ ] **Customizable Pomodoro Time**: Ability to adjust focus duration (e.g., 15m, 25m, 45m).
- [x] **Duplicate Task Prevention**: Case-insensitive validation to reject identical task entries when adding or editing tasks.
- [ ] **Sort Tasks**: Filter or sort tasks by status (all, active, completed) or alphabetical order.

---

## 🛠️ Technical Constraints & Specifications

| Requirement | Specification |
| :--- | :--- |
| **Tech Stack** | Vanilla HTML5, CSS3, Pure JavaScript (No external UI frameworks) |
| **Data Storage** | Browser `localStorage` API only (No backend server required) |
| **Browser Support** | Modern browsers (Chrome, Firefox, Safari, Edge) |
| **Design Principles** | Minimalist UI, responsive layout (320px–1920px), clear visual hierarchy, WCAG AA contrast (≥ 4.5:1) |

---

## 📂 Project Structure

```text
CodingCamp-2November26-arsyahnda/
├── .kiro/                 # Kiro workspace configuration & specs
├── css/
│   └── styles.css         # Single stylesheet file
├── js/
│   └── app.js             # Single JavaScript file
├── index.html             # Main dashboard entrypoint
└── README.md              # Project documentation
```

**Note on Folder Rules:**
- Keep strictly only **1 CSS file** inside `css/`.
- Keep strictly only **1 JavaScript file** inside `js/`.
- Ensure the `.kiro` folder is committed and pushed to GitHub.

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser.
- Git & GitHub Desktop.
- A registered Kiro account with your Builder ID ready.

### Running Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/omidibs/CodingCamp-2November26-arsyahnda.git
   ```
2. Navigate into the project folder:
   ```bash
   cd CodingCamp-2November26-arsyahnda
   ```
3. Open `index.html` directly in your browser or run a simple local development server (e.g., Live Server in VS Code).

---

## 🌐 Deployment to GitHub Pages

1. Commit and push all changes using GitHub Desktop.
2. Go to your repository on GitHub.
3. Navigate to **Settings > Pages**.
4. Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
5. Click **Save**. Your site will be published at `https://omidibs.github.io/CodingCamp-2November26-arsyahnda/`.

---

## 📋 Final Submission Checklist

Before submitting on the official Paperform form:

- [x] Repository naming adheres to format: `CodingCamp-[batch date (ddmmmyy)]-[participantname]`
- [x] Folder rules strictly followed (1 CSS file in `css/`, 1 JS file in `js/`, `.kiro` folder included)
- [x] All 4 MVP features implemented and tested
- [x] 3 challenge features implemented and functioning (light/dark mode, prevent duplicate tasks, and custom name in greetings)
- [ ] Website deployed and working via GitHub Pages
