import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input, Label, FieldError, RequiredMark } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_STAGES, LEAD_STAGE_LABELS } from "../../../constants";
import type { Lead, LeadSource, LeadStage, User } from "../../../types";

export interface LeadFormValues {
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  stage?: LeadStage;
  assigned_to?: number | null;
  next_follow_up: string;
}

interface LeadFormProps {
  initialValues?: Lead;
  employees: User[];
  isAdmin: boolean;
  isSubmitting: boolean;
  submitLabel: string;
  onSubmit: (values: LeadFormValues) => void;
  onCancel: () => void;
}

export function LeadForm({
  initialValues,
  employees,
  isAdmin,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}: LeadFormProps) {
  const [values, setValues] = useState<LeadFormValues>({
    name: initialValues?.name ?? "",
    phone: initialValues?.phone ?? "",
    email: initialValues?.email ?? "",
    source: initialValues?.source ?? "WEBSITE",
    stage: initialValues?.stage,
    assigned_to: initialValues?.assigned_to ?? undefined,
    next_follow_up: initialValues?.next_follow_up ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});

  const today = new Date().toISOString().slice(0, 10);

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!values.phone.trim()) next.phone = "Phone is required.";
    else if (!/^\d{10}$/.test(values.phone.trim())) next.phone = "Phone number must be exactly 10 digits.";
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Enter a valid email.";
    if (values.next_follow_up && values.next_follow_up < today) {
      next.next_follow_up = "Follow-up date cannot be in the past.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="lead-name">
            Name
            <RequiredMark />
          </Label>
          <Input
            id="lead-name"
            value={values.name}
            hasError={!!errors.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Full name"
          />
          <FieldError message={errors.name} />
        </div>

        <div>
          <Label htmlFor="lead-phone">
            Phone
            <RequiredMark />
          </Label>
          <Input
            id="lead-phone"
            value={values.phone}
            hasError={!!errors.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            placeholder="9876543210"
          />
          <FieldError message={errors.phone} />
        </div>

        <div>
          <Label htmlFor="lead-email">Email</Label>
          <Input
            id="lead-email"
            type="email"
            value={values.email}
            hasError={!!errors.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            placeholder="name@example.com"
          />
          <FieldError message={errors.email} />
        </div>

        <div>
          <Label htmlFor="lead-source">Source</Label>
          <Select
            id="lead-source"
            value={values.source}
            onChange={(e) => setValues((v) => ({ ...v, source: e.target.value as LeadSource }))}
          >
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        {initialValues && (
          <div>
            <Label htmlFor="lead-stage">Stage</Label>
            <Select
              id="lead-stage"
              value={values.stage}
              onChange={(e) => setValues((v) => ({ ...v, stage: e.target.value as LeadStage }))}
            >
              {LEAD_STAGES.map((s) => (
                <option key={s} value={s}>
                  {LEAD_STAGE_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
        )}

        {isAdmin && (
          <div>
            <Label htmlFor="lead-assigned">Assigned Sales Employee</Label>
            <Select
              id="lead-assigned"
              value={values.assigned_to ?? ""}
              onChange={(e) =>
                setValues((v) => ({ ...v, assigned_to: e.target.value ? Number(e.target.value) : null }))
              }
            >
              <option value="">Unassigned</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="lead-followup">Next Follow-up</Label>
          <Input
            id="lead-followup"
            type="date"
            min={today}
            value={values.next_follow_up}
            hasError={!!errors.next_follow_up}
            onChange={(e) => setValues((v) => ({ ...v, next_follow_up: e.target.value }))}
          />
          <FieldError message={errors.next_follow_up} />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
