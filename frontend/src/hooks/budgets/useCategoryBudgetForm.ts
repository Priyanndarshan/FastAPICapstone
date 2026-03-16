import { useState, useEffect } from "react";

interface UseCategoryBudgetFormOptions {
  initialName: string;
  initialAmount: string;
  initialMonth: number;
  initialYear: number;
  onSubmit: (name: string, amount: string, month: number, year: number) => Promise<void>;
}

export function useCategoryBudgetForm({
  initialName,
  initialAmount,
  initialMonth,
  initialYear,
  onSubmit,
}: UseCategoryBudgetFormOptions) {
  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState(initialAmount);
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep local state in sync when initial props change (for edit flows)
  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  // Intentionally do not sync amount after mount so the last edited value is preserved

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedAmount = amount.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    const num = parseFloat(trimmedAmount || "0");
    if (!trimmedAmount || isNaN(num) || num <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSubmit(trimmedName, trimmedAmount, month, year);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return {
    name,
    setName,
    amount,
    setAmount,
    month,
    setMonth,
    year,
    setYear,
    error,
    saving,
    handleSubmit,
  };
}

