import { useState, useRef, useEffect } from "react";
import { useCategories } from "../hooks/useCategories";

interface Category {
    id: number;
    name: string;
}

export default function Categories() {
    const { categories, loading, error, refetch, addCategory, updateCategory, removeCategory } =
        useCategories();

    // Add form state
    const [addName, setAddName] = useState("");
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState("");
    const addInputRef = useRef<HTMLInputElement>(null);

    // Edit state
    const [editId, setEditId] = useState<number | null>(null);
    const [editName, setEditName] = useState("");
    const [editError, setEditError] = useState("");
    const [saving, setSaving] = useState(false);

    // Delete state
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!addName.trim()) return;
        setAdding(true);
        setAddError("");
        try {
            await addCategory(addName.trim());
            setAddName("");
            addInputRef.current?.focus();
        } catch (err) {
            setAddError((err as Error).message);
        } finally {
            setAdding(false);
        }
    }

    async function handleSaveEdit(id: number) {
        if (!editName.trim()) return;
        setSaving(true);
        setEditError("");
        try {
            await updateCategory(id, editName.trim());
            setEditId(null);
        } catch (err) {
            setEditError((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        setDeleting(true);
        try {
            await removeCategory(id);
            setDeleteId(null);
        } catch {
            // keep modal open on error
        } finally {
            setDeleting(false);
        }
    }

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20";
    const btnPrimary =
        "rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:opacity-50";
    const btnSecondary =
        "rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2";

    return (
        <div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">Categories</h1>
            <p className="mb-8 text-slate-600">Organize expenses by category</p>

            {/* Add form */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">New category</h2>
                <form onSubmit={handleAdd} className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <label className="flex-1">
                        <span className="sr-only">Category name</span>
                        <input
                            ref={addInputRef}
                            type="text"
                            value={addName}
                            onChange={(e) => setAddName(e.target.value)}
                            placeholder="e.g. Groceries, Transport"
                            maxLength={100}
                            className={inputClass}
                        />
                    </label>
                    <button type="submit" disabled={adding || !addName.trim()} className={btnPrimary}>
                        {adding ? "Adding…" : "Add category"}
                    </button>
                </form>
                {addError && <p className="mt-3 text-sm text-red-600">{addError}</p>}
            </div>

            {/* List states */}
            {loading && (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
                    Loading…
                </div>
            )}

            {!loading && error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-700">{error}</p>
                    <button type="button" onClick={refetch} className="mt-3 text-sm font-medium text-violet-600 hover:underline">
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500 shadow-sm">
                    No categories yet. Add one above to get started.
                </div>
            )}

            {!loading && !error && categories.length > 0 && (
                <ul className="space-y-3">
                    {categories.map((cat) => (
                        <li key={cat.id}>
                            <CategoryRow
                                cat={cat}
                                isEditing={editId === cat.id}
                                editName={editName}
                                editError={editError}
                                saving={saving}
                                onEdit={() => {
                                    setEditId(cat.id);
                                    setEditName(cat.name);
                                    setEditError("");
                                }}
                                onCancelEdit={() => {
                                    setEditId(null);
                                    setEditName("");
                                    setEditError("");
                                }}
                                onEditNameChange={setEditName}
                                onSaveEdit={() => handleSaveEdit(cat.id)}
                                onDeleteClick={() => setDeleteId(cat.id)}
                            />
                        </li>
                    ))}
                </ul>
            )}

            {/* Delete confirm modal */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
                        <p className="text-slate-700">
                            Delete &quot;{categories.find((c) => c.id === deleteId)?.name}&quot;? Expenses may lose their category.
                        </p>
                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className={btnSecondary + " flex-1"}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Deleting…" : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- CategoryRow ---

interface CategoryRowProps {
    cat: Category;
    isEditing: boolean;
    editName: string;
    editError: string;
    saving: boolean;
    onEdit: () => void;
    onCancelEdit: () => void;
    onEditNameChange: (v: string) => void;
    onSaveEdit: () => void;
    onDeleteClick: () => void;
}

function CategoryRow({
    cat,
    isEditing,
    editName,
    editError,
    saving,
    onEdit,
    onCancelEdit,
    onEditNameChange,
    onSaveEdit,
    onDeleteClick,
}: CategoryRowProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const inputClass =
        "w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

    if (isEditing) {
        return (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <input
                    ref={inputRef}
                    type="text"
                    value={editName}
                    onChange={(e) => onEditNameChange(e.target.value)}
                    maxLength={100}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") onSaveEdit();
                        if (e.key === "Escape") onCancelEdit();
                    }}
                    className={inputClass + " mb-3"}
                />
                {editError && <p className="mb-3 text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onSaveEdit}
                        disabled={saving || !editName.trim()}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                    <button type="button" onClick={onCancelEdit} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow">
            <span className="font-medium text-slate-800">{cat.name}</span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={onDeleteClick}
                    className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}