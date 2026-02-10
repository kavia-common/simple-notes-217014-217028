import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'simple-notes.retro.v1';

function generateId() {
  // Small, dependency-free id generator suitable for local state.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// PUBLIC_INTERFACE
function App() {
  /** Retro-themed notes app with add/edit/delete and local persistence. */
  const [notes, setNotes] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);

  const inputRef = useRef(null);

  useEffect(() => {
    // Persist notes locally (optional persistence requested).
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // If storage is unavailable (private mode, quotas), app still works in-memory.
    }
  }, [notes]);

  const editingNote = useMemo(
    () => (editingId ? notes.find(n => n.id === editingId) : null),
    [editingId, notes]
  );

  useEffect(() => {
    // When switching into edit mode, preload draft and focus input.
    if (editingNote) {
      setDraft(editingNote.text);
      // focus next tick to ensure input is rendered
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [editingNote]);

  // PUBLIC_INTERFACE
  const handleSubmit = (e) => {
    /** Add a new note or save edits for an existing note. */
    e.preventDefault();

    const cleaned = draft.trim();
    if (!cleaned) return;

    if (editingId) {
      setNotes(prev =>
        prev.map(n =>
          n.id === editingId
            ? { ...n, text: cleaned, updatedAt: Date.now() }
            : n
        )
      );
      setEditingId(null);
      setDraft('');
      return;
    }

    const now = Date.now();
    const newNote = {
      id: generateId(),
      text: cleaned,
      createdAt: now,
      updatedAt: now,
    };

    setNotes(prev => [newNote, ...prev]);
    setDraft('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // PUBLIC_INTERFACE
  const startEdit = (id) => {
    /** Enter edit mode for a given note id. */
    setEditingId(id);
  };

  // PUBLIC_INTERFACE
  const cancelEdit = () => {
    /** Exit edit mode and clear draft. */
    setEditingId(null);
    setDraft('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // PUBLIC_INTERFACE
  const deleteNote = (id) => {
    /** Delete a note by id. */
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editingId === id) cancelEdit();
  };

  // PUBLIC_INTERFACE
  const clearAll = () => {
    /** Clear all notes (with confirmation). */
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete all notes? This cannot be undone.');
    if (!ok) return;
    setNotes([]);
    cancelEdit();
  };

  const countLabel = notes.length === 1 ? '1 note' : `${notes.length} notes`;

  return (
    <div className="App">
      <header className="Header">
        <div className="Header__brand">
          <div className="Badge" aria-hidden="true">SN</div>
          <div>
            <h1 className="Title">Simple Notes</h1>
            <p className="Subtitle">Retro UI • fast thoughts • no login</p>
          </div>
        </div>

        <div className="Header__meta">
          <div className="Counter" aria-label="Notes count">{countLabel}</div>
          <button
            type="button"
            className="Btn Btn--ghost"
            onClick={clearAll}
            disabled={notes.length === 0}
          >
            Clear all
          </button>
        </div>
      </header>

      <main className="Main">
        <section className="Composer" aria-label="Add or edit a note">
          <form className="Composer__form" onSubmit={handleSubmit}>
            <label className="Label" htmlFor="noteText">
              {editingId ? 'Edit note' : 'New note'}
            </label>

            <div className="InputRow">
              <input
                id="noteText"
                ref={inputRef}
                className="Input"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type something and hit Enter…"
                maxLength={240}
                autoComplete="off"
              />

              <button
                className="Btn Btn--primary"
                type="submit"
                disabled={!draft.trim()}
              >
                {editingId ? 'Save' : 'Add'}
              </button>

              {editingId ? (
                <button className="Btn Btn--ghost" type="button" onClick={cancelEdit}>
                  Cancel
                </button>
              ) : null}
            </div>

            <p className="Help">
              Tip: Click <span className="Kbd">Edit</span> to modify a note. Notes are stored in your browser.
            </p>
          </form>
        </section>

        <section className="Notes" aria-label="Notes list">
          {notes.length === 0 ? (
            <div className="Empty">
              <p className="Empty__title">No notes yet.</p>
              <p className="Empty__text">Add your first note above to get started.</p>
            </div>
          ) : (
            <ul className="Notes__list">
              {notes.map((note) => {
                const isEditing = note.id === editingId;
                return (
                  <li key={note.id} className={`Card ${isEditing ? 'Card--active' : ''}`}>
                    <div className="Card__body">
                      <p className="Card__text">{note.text}</p>
                      <div className="Card__footer">
                        <span className="Card__timestamp">
                          {new Date(note.updatedAt).toLocaleString()}
                        </span>
                        <div className="Card__actions">
                          <button
                            type="button"
                            className="Btn Btn--small"
                            onClick={() => startEdit(note.id)}
                            disabled={isEditing}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="Btn Btn--small Btn--danger"
                            onClick={() => deleteNote(note.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <footer className="Footer">
        <p className="Footer__text">
          Built with React • Retro palette: <span className="Swatch Swatch--primary" aria-label="primary color" />{' '}
          <span className="Swatch Swatch--success" aria-label="accent color" />
        </p>
      </footer>
    </div>
  );
}

export default App;
