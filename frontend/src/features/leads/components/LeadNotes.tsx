import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Label } from "../../../components/ui/Input";
import type { LeadNote } from "../../../types";
import { formatDateTime } from "../../../utils/format";

interface LeadNotesProps {
  notes: LeadNote[];
  isLoading: boolean;
  isSubmitting: boolean;
  onAddNote: (content: string) => void;
}

export function LeadNotes({ notes, isLoading, isSubmitting, onAddNote }: LeadNotesProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Note cannot be empty.");
      return;
    }
    setError(null);
    onAddNote(content.trim());
    setContent("");
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-5">
        <Label htmlFor="new-note">Add Note</Label>
        <textarea
          id="new-note"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an update about this lead…"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-slate focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/40"
        />
        {error && (
          <p role="alert" className="mt-1 text-sm text-rust">
            {error}
          </p>
        )}
        <div className="mt-2 flex justify-end">
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Save Note
          </Button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-ink-soft">Loading notes…</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-ink-soft">No notes yet. Add the first update above.</p>
      ) : (
        <ul className="space-y-4">
          {notes
            .slice()
            .reverse()
            .map((note) => (
              <li key={note.id} className="border-l-2 border-border pl-4">
                <div className="flex items-center gap-2 text-xs text-ink-soft">
                  <span className="font-medium text-ink">{note.created_by_user?.name ?? "Unknown"}</span>
                  <span>·</span>
                  <span>{formatDateTime(note.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-ink">{note.content}</p>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
