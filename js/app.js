/**
 * Todo Life Dashboard — app.js
 * All application logic lives here; no inline scripts in HTML.
 * Organized as an IIFE with five internal widget modules and a shared StorageService.
 */

// ── StorageService ────────────────────────────────────────────────────────
const StorageService = {
  /**
   * Load and JSON-parse a value from localStorage.
   * Returns null if the key is absent or the stored value is unparseable.
   * Discards malformed data from localStorage (Req 7.3, 10.3).
   * @param {string} key
   * @returns {any|null}
   */
  load(key) {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      // Malformed JSON — discard and treat as missing (Req 7.3, 10.3)
      localStorage.removeItem(key);
      return null;
    }
  },

  /**
   * JSON-stringify a value and write it to localStorage.
   * Silently swallows QuotaExceededError so the app keeps running.
   * @param {string} key
   * @param {any} value
   */
  save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      // Only swallow storage-quota errors; re-throw everything else
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        return;
      }
      throw err;
    }
  },

  /**
   * Remove a key from localStorage.
   * @param {string} key
   */
  remove(key) {
    localStorage.removeItem(key);
  },
};

// ── Validation Helpers ────────────────────────────────────────────────────

/**
 * Validate a task description.
 * Trims whitespace, enforces length limits (1–500 chars), and optionally checks
 * for case-insensitive duplicates against an existing task array.
 *
 * @param {string} raw - The raw input string.
 * @param {Array<{id:string, description:string}>} [existingTasks] - Current task list.
 * @param {string} [excludeId] - Id of the task being edited (skipped in duplicate check).
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
function validateTaskDescription(raw, existingTasks, excludeId) {
  const trimmed = (raw ?? '').trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'Task description cannot be empty.' };
  }

  if (trimmed.length > 500) {
    return { ok: false, error: 'Task description cannot exceed 500 characters.' };
  }

  if (Array.isArray(existingTasks)) {
    const normalized = trimmed.toLowerCase();
    for (const task of existingTasks) {
      if (task.id === excludeId) continue;
      if (task.description.trim().toLowerCase() === normalized) {
        return { ok: false, error: 'Task already exists.' };
      }
    }
  }

  return { ok: true, value: trimmed };
}

/**
 * Validate a quick-link URL.
 * Accepts only non-empty strings that begin with http:// or https://.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
function validateLinkUrl(raw) {
  const str = (raw ?? '').trim();
  if (str.length === 0) {
    return { ok: false, error: 'URL cannot be empty.' };
  }
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    return { ok: false, error: 'URL must start with http:// or https://.' };
  }
  return { ok: true, value: str };
}

/**
 * Validate a quick-link label.
 * Trims whitespace and rejects empty strings.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
function validateLinkLabel(raw) {
  const trimmed = (raw ?? '').trim();
  if (trimmed.length === 0) {
    return { ok: false, error: 'Label cannot be empty.' };
  }
  return { ok: true, value: trimmed };
}

/**
 * Validate a user name for the personalised greeting.
 * Trims whitespace, rejects empty strings and names over 100 characters.
 *
 * @param {string} raw
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
function validateUserName(raw) {
  const trimmed = (raw ?? '').trim();

  if (trimmed.length === 0) {
    return { ok: false, error: 'Name cannot be empty.' };
  }

  if (trimmed.length > 100) {
    return { ok: false, error: 'Name cannot exceed 100 characters.' };
  }

  return { ok: true, value: trimmed };
}

/**
 * Generate a unique id.
 * Uses crypto.randomUUID() when available, falls back to a timestamp + random
 * combination for environments that do not support the Web Crypto API.
 *
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}${Math.random()}`;
}

/**
 * Toggle the `completed` state of a task identified by `id` within the given
 * task array. Mutates the matching task in-place and returns `true` if found,
 * `false` if no task with that id exists.
 *
 * @param {string} id
 * @param {Array<{id:string, description:string, completed:boolean, createdAt:number}>} tasks
 * @returns {boolean} Whether a matching task was found and toggled.
 */
function toggleTaskInList(id, tasks) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return false;
  task.completed = !task.completed;
  return true;
}

/**
 * Delete a task identified by `id` from the given task array.
 * Mutates the array in-place by splicing out the matching entry.
 * Returns `true` if a task was found and removed, `false` otherwise.
 *
 * @param {string} id
 * @param {Array<{id:string, description:string, completed:boolean, createdAt:number}>} tasks
 * @returns {boolean} Whether a matching task was found and deleted.
 */
function deleteTaskFromList(id, tasks) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

/**
 * Edit the description of a task identified by `id` within the given task array.
 * Validates the new description (including cross-task duplicate prevention while
 * allowing self-matches) before mutating in-place.
 *
 * @param {string} id
 * @param {string} newDescription
 * @param {Array<{id:string, description:string, completed:boolean, createdAt:number}>} tasks
 * @returns {{ ok: boolean, value?: string, error?: string }}
 */
function editTaskInList(id, newDescription, tasks) {
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return { ok: false, error: 'Task not found.' };
  }
  const validation = validateTaskDescription(newDescription, tasks, id);
  if (!validation.ok) {
    return validation;
  }
  task.description = validation.value;
  return validation;
}

/**
 * Compute the time-of-day greeting based on the local hour.
 * If a non-empty name is provided (after trimming whitespace), the greeting is
 * personalised as "[greeting], [trimmedName]!".
 *
 * Hour ranges:
 *   05–11 → "Good Morning"
 *   12–17 → "Good Afternoon"
 *   18–20 → "Good Evening"
 *   21–23 | 0–4 → "Good Night"
 *
 * @param {number} hour - Local hour in [0, 23].
 * @param {string} [name] - Optional user name.
 * @returns {string}
 */
function computeGreeting(hour, name) {
  let greeting;
  if (hour >= 5 && hour <= 11) {
    greeting = 'Good Morning';
  } else if (hour >= 12 && hour <= 17) {
    greeting = 'Good Afternoon';
  } else if (hour >= 18 && hour <= 20) {
    greeting = 'Good Evening';
  } else {
    // 21–23 and 0–4
    greeting = 'Good Night';
  }

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (trimmedName.length > 0) {
    return `${greeting}, ${trimmedName}!`;
  }
  return greeting;
}

// ── FocusTimerWidget ──────────────────────────────────────────────────────

/** @type {{ phase: 'IDLE'|'RUNNING'|'PAUSED'|'DONE', remainingSeconds: number, intervalId: number|null }} */
const _timerState = { phase: 'IDLE', remainingSeconds: 1500, intervalId: null };

/**
 * Format total seconds as a zero-padded MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatTimerTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const mm = Math.floor(safeSeconds / 60);
  const ss = safeSeconds % 60;
  return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

/** Write the current remainingSeconds to #timer-display. */
function _renderTimer() {
  const el = document.getElementById('timer-display');
  if (el) el.textContent = formatTimerTime(_timerState.remainingSeconds);
}

/** Show or hide the "Session Complete" done indicator. */
function _setDoneIndicator(visible) {
  const msg = document.getElementById('timer-done-msg');
  const display = document.getElementById('timer-display');
  if (msg) msg.hidden = !visible;
  if (display) {
    if (visible) {
      display.classList.add('timer-display--done');
    } else {
      display.classList.remove('timer-display--done');
    }
  }
}

const FocusTimerWidget = {
  /** Expose state so tests can read and mutate it directly. */
  state: _timerState,

  /**
   * Begin decrementing. Ignored if already RUNNING or in DONE state (Req 2.7, 2.8).
   */
  start() {
    if (_timerState.phase === 'RUNNING' || _timerState.phase === 'DONE') return;

    _timerState.phase = 'RUNNING';
    _timerState.intervalId = setInterval(function () {
      _timerState.remainingSeconds -= 1;
      _renderTimer();

      if (_timerState.remainingSeconds <= 0) {
        clearInterval(_timerState.intervalId);
        _timerState.intervalId = null;
        _timerState.remainingSeconds = 0;
        _timerState.phase = 'DONE';
        _renderTimer();
        _setDoneIndicator(true);
      }
    }, 1000);
  },

  /**
   * Pause the countdown at the current remaining time (Req 2.4).
   */
  stop() {
    if (_timerState.phase !== 'RUNNING') return;
    if (_timerState.intervalId !== null) {
      clearInterval(_timerState.intervalId);
      _timerState.intervalId = null;
    }
    _timerState.phase = 'PAUSED';
  },

  /**
   * Stop the countdown, restore 25:00, and clear the done indicator (Req 2.5).
   */
  reset() {
    if (_timerState.intervalId !== null) {
      clearInterval(_timerState.intervalId);
      _timerState.intervalId = null;
    }
    _timerState.phase = 'IDLE';
    _timerState.remainingSeconds = 1500;
    _renderTimer();
    _setDoneIndicator(false);
  },

  /**
   * Register button listeners and show the initial 25:00 display (Req 2.1).
   */
  init() {
    const btnStart = document.getElementById('btn-start');
    const btnStop = document.getElementById('btn-stop');
    const btnReset = document.getElementById('btn-reset');

    if (btnStart) btnStart.addEventListener('click', () => this.start());
    if (btnStop) btnStop.addEventListener('click', () => this.stop());
    if (btnReset) btnReset.addEventListener('click', () => this.reset());

    _renderTimer();
    _setDoneIndicator(_timerState.phase === 'DONE');
  },
};

// ── ThemeWidget ───────────────────────────────────────────────────────────
const ThemeWidget = {
  /** @type {'light'|'dark'} */
  _theme: 'light',

  /**
   * Read tld_theme from storage, apply data-theme to <html>,
   * and register the toggle-button click listener.
   * MUST be called first in the DOMContentLoaded handler (Req 13.5).
   */
  init() {
    const stored = StorageService.load('tld_theme');
    this._theme = stored === 'dark' || stored === 'light' ? stored : 'light';
    this._applyTheme();
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },

  /**
   * Flip the active theme, persist it, and update data-theme on <html> (Req 13.2–13.4).
   */
  toggle() {
    this._theme = this._theme === 'light' ? 'dark' : 'light';
    StorageService.save('tld_theme', this._theme);
    this._applyTheme();
  },

  _applyTheme() {
    document.documentElement.setAttribute('data-theme', this._theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = this._theme === 'dark' ? '☀️' : '🌙';
      btn.setAttribute(
        'aria-label',
        this._theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
      );
    }
  },
};

// ── GreetingWidget ────────────────────────────────────────────────────────
const GreetingWidget = {
  /** @type {number|null} */
  _intervalId: null,

  /**
   * Render the current time/date/greeting and start the 60-second tick.
   * Loads the stored username (if any) and applies it to the greeting.
   * Registers Save and Clear control event listeners.
   */
  init() {
    if (this._intervalId !== null) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }

    const storedName = StorageService.load('tld_username');
    const nameInput = document.getElementById('name-input');
    if (nameInput && typeof storedName === 'string') {
      nameInput.value = storedName;
    }

    this._tick();
    this._intervalId = setInterval(() => this._tick(), 1000);

    const btnSave = document.getElementById('btn-save-name');
    const btnClear = document.getElementById('btn-clear-name');

    if (btnSave) {
      btnSave.addEventListener('click', () => this._saveName());
    }
    if (btnClear) {
      btnClear.addEventListener('click', () => this._clearName());
    }

    // Allow Enter key in the name input to trigger Save
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._saveName();
      });
    }
  },

  /**
   * Read the current date/time and update all greeting DOM elements.
   * Reads tld_username from storage on each tick so it stays in sync.
   */
  _tick() {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    // HH:MM:SS 24-hour zero-padded
    const timeStr =
      String(hour).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds).padStart(2, '0');

    // "Weekday, Month Day, Year" e.g. "Monday, January 1, 2025" (Req 1.2)
    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const storedName = StorageService.load('tld_username');
    const validStoredName = typeof storedName === 'string' ? storedName : undefined;
    const greetingStr = computeGreeting(hour, validStoredName);

    const timeEl = document.getElementById('time');
    const dateEl = document.getElementById('date');
    const greetingEl = document.getElementById('greeting');

    if (timeEl) timeEl.textContent = timeStr;
    if (dateEl) dateEl.textContent = dateStr;
    if (greetingEl) greetingEl.textContent = greetingStr;
  },

  /**
   * Read the name input, validate, persist, and refresh the greeting (Req 15.2, 15.6, 15.7).
   */
  _saveName() {
    const nameInput = document.getElementById('name-input');
    const raw = nameInput ? nameInput.value : '';
    const result = validateUserName(raw);

    if (!result.ok) {
      this._showNameError(result.error);
      return;
    }

    this._clearNameError();
    StorageService.save('tld_username', result.value);
    if (nameInput) nameInput.value = result.value;
    this._tick();
  },

  /**
   * Remove the stored username and refresh the greeting in name-less format (Req 15.5).
   */
  _clearName() {
    this._clearNameError();
    StorageService.remove('tld_username');
    const nameInput = document.getElementById('name-input');
    if (nameInput) nameInput.value = '';
    this._tick();
  },

  /**
   * Display a validation error message near the name controls.
   * @param {string} message
   */
  _showNameError(message) {
    let errEl = document.getElementById('name-error');
    if (!errEl) {
      errEl = document.createElement('div');
      errEl.id = 'name-error';
      errEl.className = 'error-message';
      errEl.setAttribute('aria-live', 'polite');
      const controls = document.querySelector('.greeting-name-controls');
      if (controls) controls.after(errEl);
    }
    errEl.textContent = message;
    errEl.hidden = false;
  },

  /**
   * Hide and clear the name validation error message.
   */
  _clearNameError() {
    const errEl = document.getElementById('name-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.hidden = true;
    }
  },
};

// ── TodoWidget ────────────────────────────────────────────────────────────
const TodoWidget = {
  /** @type {Array<{id:string, description:string, completed:boolean, createdAt:number}>} */
  _tasks: [],

  /** @type {string|null} */
  _editingId: null,

  /**
   * Load tasks from storage, render the list, and register Add/Enter listeners.
   * Req 7.1, 7.2, 7.3
   */
  init() {
    const loaded = StorageService.load('tld_todos');
    if (Array.isArray(loaded)) {
      this._tasks = loaded;
    } else {
      if (loaded !== null) {
        StorageService.remove('tld_todos');
      }
      this._tasks = [];
    }
    this._editingId = null;
    this._renderList();

    const btnAdd = document.getElementById('btn-add-todo');
    const input = document.getElementById('todo-input');

    if (btnAdd) btnAdd.addEventListener('click', () => this._addTask());
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._addTask();
      });
    }
  },

  /**
   * Validate and append a new task to the list.
   * Includes duplicate detection via validateTaskDescription.
   * Req 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 14.1, 14.2
   */
  _addTask() {
    const input = document.getElementById('todo-input');
    const raw = input ? input.value : '';
    const result = validateTaskDescription(raw, this._tasks);

    if (!result.ok) {
      this._showError(result.error);
      return result;
    }

    this._clearError();
    const task = {
      id: generateId(),
      description: result.value,
      completed: false,
      createdAt: Date.now(),
    };
    this._tasks.push(task);
    StorageService.save('tld_todos', this._tasks);
    this._renderList();
    if (input) input.value = '';
    return result;
  },

  /**
   * Enter edit mode for a task. If another task is already in edit mode,
   * cancels the first edit automatically (discarding unsaved changes) and
   * enters edit mode for the selected task (Req 4.2, 4.3).
   * @param {string} id - The id of the task to edit.
   */
  _startEdit(id) {
    this._editingId = id;
    this._clearError();
    this._renderList();

    const editInput = document.querySelector(
      `#todo-list li[data-id="${id}"] .todo-item__edit-input`
    );
    if (editInput) {
      editInput.focus();
      const len = editInput.value.length;
      editInput.setSelectionRange(len, len);
    }
  },

  /**
   * Validate and commit an edited task description.
   * Passes the task's own `id` as `excludeId` so self-edits succeed while
   * cross-task duplicates are rejected (Req 4.4, 4.5, 4.6, 14.3, 14.4, 14.5).
   * @param {string} id - The id of the task being edited.
   * @param {string} newDescription - The new description entered by the user.
   */
  _editTask(id, newDescription) {
    const result = editTaskInList(id, newDescription, this._tasks);

    if (!result.ok) {
      this._showError(result.error);
      return result;
    }

    this._editingId = null;
    this._clearError();
    StorageService.save('tld_todos', this._tasks);
    this._renderList();
    return result;
  },

  /**
   * Cancel the active edit, discarding unsaved changes and restoring the
   * original task description display (Req 4.7).
   */
  _cancelEdit() {
    this._editingId = null;
    this._clearError();
    this._renderList();
  },

  /**
   * Flip the completed state of a task, persist to storage, and re-render.
   * Req 5.1, 5.2, 5.3, 5.4
   * @param {string} id - The id of the task to toggle.
   */
  _toggleTask(id) {
    if (!toggleTaskInList(id, this._tasks)) return;
    StorageService.save('tld_todos', this._tasks);
    this._renderList();
  },

  /**
   * Remove a task from the in-memory list, persist to storage, and re-render.
   * Req 6.1, 6.2, 6.3
   * @param {string} id - The id of the task to delete.
   */
  _deleteTask(id) {
    if (!deleteTaskFromList(id, this._tasks)) return;
    if (this._editingId === id) {
      this._editingId = null;
    }
    StorageService.save('tld_todos', this._tasks);
    this._renderList();
  },

  /**
   * Clear the todo-list container and re-render all tasks from in-memory state.
   * Renders either normal view (checkbox, label, Edit, Delete) or edit mode
   * (checkbox, pre-filled text input, Save, Cancel, Delete) for `this._editingId`.
   */
  _renderList() {
    const list = document.getElementById('todo-list');
    if (!list) return;
    list.innerHTML = '';

    for (const task of this._tasks) {
      const li = document.createElement('li');
      li.className =
        'todo-item' +
        (task.completed ? ' task--completed todo-item--completed' : '');
      li.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(task.completed);
      checkbox.className = 'todo-item__checkbox';
      checkbox.setAttribute(
        'aria-label',
        `Mark "${task.description}" as ${task.completed ? 'incomplete' : 'complete'}`
      );
      checkbox.addEventListener('change', () => this._toggleTask(task.id));
      li.appendChild(checkbox);

      const actions = document.createElement('div');
      actions.className = 'todo-item__actions';

      if (this._editingId === task.id) {
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'input todo-item__edit-input';
        editInput.value = task.description;
        editInput.maxLength = 500;
        editInput.setAttribute('aria-label', `Edit description for ${task.description}`);

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this._editTask(task.id, editInput.value);
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this._cancelEdit();
          }
        });

        const btnSave = document.createElement('button');
        btnSave.type = 'button';
        btnSave.className = 'btn btn--small btn--primary';
        btnSave.textContent = 'Save';
        btnSave.setAttribute('aria-label', `Save task: ${task.description}`);
        btnSave.addEventListener('click', () =>
          this._editTask(task.id, editInput.value)
        );

        const btnCancel = document.createElement('button');
        btnCancel.type = 'button';
        btnCancel.className = 'btn btn--small btn--secondary';
        btnCancel.textContent = 'Cancel';
        btnCancel.setAttribute('aria-label', `Cancel editing task: ${task.description}`);
        btnCancel.addEventListener('click', () => this._cancelEdit());

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn--small btn--danger';
        btnDelete.textContent = 'Delete';
        btnDelete.setAttribute('aria-label', `Delete task: ${task.description}`);
        btnDelete.addEventListener('click', () => this._deleteTask(task.id));

        li.appendChild(editInput);
        actions.appendChild(btnSave);
        actions.appendChild(btnCancel);
        actions.appendChild(btnDelete);
        li.appendChild(actions);
      } else {
        const label = document.createElement('span');
        label.className = 'todo-item__label';
        label.textContent = task.description;

        const btnEdit = document.createElement('button');
        btnEdit.type = 'button';
        btnEdit.className = 'btn btn--small btn--secondary';
        btnEdit.textContent = 'Edit';
        btnEdit.setAttribute('aria-label', `Edit task: ${task.description}`);
        btnEdit.addEventListener('click', () => this._startEdit(task.id));

        const btnDelete = document.createElement('button');
        btnDelete.type = 'button';
        btnDelete.className = 'btn btn--small btn--danger';
        btnDelete.textContent = 'Delete';
        btnDelete.setAttribute('aria-label', `Delete task: ${task.description}`);
        btnDelete.addEventListener('click', () => this._deleteTask(task.id));

        li.appendChild(label);
        actions.appendChild(btnEdit);
        actions.appendChild(btnDelete);
        li.appendChild(actions);
      }

      list.appendChild(li);
    }
  },

  /**
   * Display an inline error message in the todo error element.
   * @param {string} message
   */
  _showError(message) {
    const errEl = document.getElementById('todo-error');
    if (errEl) {
      errEl.textContent = message;
      errEl.hidden = false;
    }
  },

  /**
   * Hide and clear the todo error message.
   */
  _clearError() {
    const errEl = document.getElementById('todo-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.hidden = true;
    }
  },
};

// ── QuickLinksWidget ──────────────────────────────────────────────────────
const QuickLinksWidget = {
  /** @type {Array<{id:string, label:string, url:string}>} */
  _links: [],

  /**
   * Load links from storage, render the panel, and register Add-link listeners.
   * Req 8.1, 8.2, 10.1, 10.2, 10.3
   */
  init() {
    const loaded = StorageService.load('tld_links');
    if (Array.isArray(loaded)) {
      this._links = loaded;
    } else {
      if (loaded !== null) {
        StorageService.remove('tld_links');
      }
      this._links = [];
    }
    this._renderLinks();

    const btnAdd = document.getElementById('btn-add-link');
    const labelInput = document.getElementById('link-label-input');
    const urlInput = document.getElementById('link-url-input');

    if (btnAdd) {
      btnAdd.addEventListener('click', () => this._addLink());
    }
    if (labelInput) {
      labelInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._addLink();
      });
    }
    if (urlInput) {
      urlInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._addLink();
      });
    }
  },

  /**
   * Validate label and URL inputs, add a new Link, persist to localStorage,
   * and re-render the QuickLinks panel (Req 8.3, 8.4).
   */
  _addLink() {
    const labelInput = document.getElementById('link-label-input');
    const urlInput = document.getElementById('link-url-input');

    const rawLabel = labelInput ? labelInput.value : '';
    const rawUrl = urlInput ? urlInput.value : '';

    const labelResult = validateLinkLabel(rawLabel);
    if (!labelResult.ok) {
      this._showError(labelResult.error);
      return labelResult;
    }

    const urlResult = validateLinkUrl(rawUrl);
    if (!urlResult.ok) {
      this._showError(urlResult.error);
      return urlResult;
    }

    this._clearError();
    const link = {
      id: generateId(),
      label: labelResult.value,
      url: urlResult.value ?? rawUrl.trim(),
    };
    this._links.push(link);
    StorageService.save('tld_links', this._links);
    this._renderLinks();

    if (labelInput) labelInput.value = '';
    if (urlInput) urlInput.value = '';
    return { ok: true, value: link };
  },

  /**
   * Remove a link by id, persist to localStorage, and re-render (Req 9.1, 9.2).
   * @param {string} id - The id of the link to delete.
   */
  _deleteLink(id) {
    const index = this._links.findIndex((l) => l.id === id);
    if (index === -1) return;
    this._links.splice(index, 1);
    StorageService.save('tld_links', this._links);
    this._renderLinks();
  },

  /**
   * Render all saved links inside #links-container.
   * Each link renders as a labeled button/anchor opening in a new tab
   * (`target="_blank" rel="noopener noreferrer"`) paired with a Delete button
   * (Req 8.1, 8.5, 9.1).
   */
  _renderLinks() {
    const container = document.getElementById('links-container');
    if (!container) return;
    container.innerHTML = '';

    for (const link of this._links) {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.dataset.id = link.id;

      const anchor = document.createElement('a');
      anchor.className = 'link-item__btn';
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.label;
      anchor.setAttribute('role', 'button');

      const btnDelete = document.createElement('button');
      btnDelete.type = 'button';
      btnDelete.className = 'link-item__delete';
      btnDelete.textContent = '×';
      btnDelete.setAttribute('aria-label', `Delete link: ${link.label}`);
      btnDelete.title = `Delete ${link.label}`;
      btnDelete.addEventListener('click', () => this._deleteLink(link.id));

      item.appendChild(anchor);
      item.appendChild(btnDelete);
      container.appendChild(item);
    }
  },

  /**
   * Display an inline error message in the link error element.
   * @param {string} message
   */
  _showError(message) {
    const errEl = document.getElementById('link-error');
    if (errEl) {
      errEl.textContent = message;
      errEl.hidden = false;
    }
  },

  /**
   * Hide and clear the link error message.
   */
  _clearError() {
    const errEl = document.getElementById('link-error');
    if (errEl) {
      errEl.textContent = '';
      errEl.hidden = true;
    }
  },
};

// Expose pure helpers and widgets on globalThis for testability
Object.assign(globalThis, {
  StorageService,
  validateTaskDescription,
  validateLinkUrl,
  validateLinkLabel,
  validateUserName,
  generateId,
  toggleTaskInList,
  deleteTaskFromList,
  editTaskInList,
  computeGreeting,
  formatTimerTime,
  ThemeWidget,
  GreetingWidget,
  FocusTimerWidget,
  TodoWidget,
  QuickLinksWidget,
});

// ── App Bootstrap IIFE ────────────────────────────────────────────────────
(function () {
  'use strict';

  function bootstrap() {
    // ThemeWidget MUST be first to prevent flash-of-wrong-theme (Req 13.5)
    ThemeWidget.init();
    GreetingWidget.init();
    FocusTimerWidget.init();
    TodoWidget.init();
    QuickLinksWidget.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
