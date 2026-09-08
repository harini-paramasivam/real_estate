import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input, Label, FieldError, RequiredMark } from "../../../components/ui/Input";

export function CreateBuildingForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  isSubmitting: boolean;
  onSubmit: (values: { name: string; description?: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Building name is required.");
      return;
    }
    onSubmit({ name: name.trim(), description: description.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Label htmlFor="building-name">
        Building Name
        <RequiredMark />
      </Label>
      <Input id="building-name" value={name} hasError={!!error} onChange={(e) => setName(e.target.value)} placeholder="Block A" />
      <FieldError message={error} />
      <div className="mt-4">
        <Label htmlFor="building-description">Description</Label>
        <textarea
          id="building-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/40"
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Add Building
        </Button>
      </div>
    </form>
  );
}
