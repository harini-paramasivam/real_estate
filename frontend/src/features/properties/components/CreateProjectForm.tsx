import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input, Label, FieldError, RequiredMark } from "../../../components/ui/Input";

interface CreateProjectFormProps {
  isSubmitting: boolean;
  onSubmit: (values: { name: string; location: string; description?: string }) => void;
  onCancel: () => void;
}

export function CreateProjectForm({ isSubmitting, onSubmit, onCancel }: CreateProjectFormProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; location?: string }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Project name is required.";
    if (!location.trim()) next.location = "Location is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ name: name.trim(), location: location.trim(), description: description.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <Label htmlFor="project-name">
            Project Name
            <RequiredMark />
          </Label>
          <Input id="project-name" value={name} hasError={!!errors.name} onChange={(e) => setName(e.target.value)} />
          <FieldError message={errors.name} />
        </div>
        <div>
          <Label htmlFor="project-location">
            Location
            <RequiredMark />
          </Label>
          <Input
            id="project-location"
            value={location}
            hasError={!!errors.location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <FieldError message={errors.location} />
        </div>
        <div>
          <Label htmlFor="project-description">Description</Label>
          <textarea
            id="project-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/40"
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Project
        </Button>
      </div>
    </form>
  );
}
