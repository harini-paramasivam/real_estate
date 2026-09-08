import { useState, type FormEvent } from "react";
import { Button } from "../../../components/ui/Button";
import { Input, Label, FieldError, RequiredMark } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { UNIT_TYPES, UNIT_TYPE_LABELS } from "../../../constants";
import type { UnitType } from "../../../types";

export function CreateUnitForm({
  isSubmitting,
  onSubmit,
  onCancel,
}: {
  isSubmitting: boolean;
  onSubmit: (values: { unit_number: string; unit_type: UnitType; price: string }) => void;
  onCancel: () => void;
}) {
  const [unitNumber, setUnitNumber] = useState("");
  const [unitType, setUnitType] = useState<UnitType>("2_BHK");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<{ unitNumber?: string; price?: string }>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!unitNumber.trim()) next.unitNumber = "Unit number is required.";
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) next.price = "Price must be greater than 0.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ unit_number: unitNumber.trim(), unit_type: unitType, price });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <Label htmlFor="unit-number">
            Unit Number
            <RequiredMark />
          </Label>
          <Input
            id="unit-number"
            value={unitNumber}
            hasError={!!errors.unitNumber}
            onChange={(e) => setUnitNumber(e.target.value)}
            placeholder="A-101"
          />
          <FieldError message={errors.unitNumber} />
        </div>
        <div>
          <Label htmlFor="unit-type">
            Unit Type
            <RequiredMark />
          </Label>
          <Select id="unit-type" value={unitType} onChange={(e) => setUnitType(e.target.value as UnitType)}>
            {UNIT_TYPES.map((t) => (
              <option key={t} value={t}>
                {UNIT_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="unit-price">
            Price (₹)
            <RequiredMark />
          </Label>
          <Input
            id="unit-price"
            type="number"
            min={1}
            value={price}
            hasError={!!errors.price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="6500000"
          />
          <FieldError message={errors.price} />
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Add Unit
        </Button>
      </div>
    </form>
  );
}
