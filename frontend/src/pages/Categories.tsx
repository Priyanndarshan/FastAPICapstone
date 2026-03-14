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

    return (
        <div className="p-6">
            <h1 className="mb-6 text-xl font-semibold text-gray-800">Categories</h1>

            {/* Add form */}
            <form onSubmit={handleAdd} className="mb-6 flex gap-2">
                <input
                    ref={addInputRef}
                    type="text"
                    value={addName}
                    onChange={(e) => setAddName(e.target.value)}
                    placeholder="New category name"
                    maxLength={100}
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button
                    type="submit"
                    disabled={adding || !addName.trim()}
                    className="rounded bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                >
                    {adding ? "Adding…" : "Add"}
                </button>
            </form>
            {addError && <p className="mb-4 text-sm text-red-600">{addError}</p>}

            {/* List states */}
            {loading && <p className="text-gray-500">Loading…</p>}

            {!loading && error && (
                <div>
                    <p className="text-red-600">{error}</p>
                    <button
                        type="button"
                        onClick={refetch}
                        className="mt-2 text-sm text-violet-600 hover:underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <p className="text-gray-500">No categories yet. Add one above.</p>
            )}

            {!loading && !error && categories.length > 0 && (
                <ul className="space-y-2">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
                        <p className="text-gray-800">
                            Delete &quot;{categories.find((c) => c.id === deleteId)?.name}&quot;? Expenses may lose their category.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="flex-1 rounded border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(deleteId)}
                                disabled={deleting}
                                className="flex-1 rounded bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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

    if (isEditing) {
        return (
            <div className="rounded border border-gray-200 bg-gray-50 p-3">
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
                    className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                {editError && <p className="mb-2 text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onSaveEdit}
                        disabled={saving || !editName.trim()}
                        className="rounded bg-violet-600 px-3 py-1.5 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                        {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                        type="button"
                        onClick={onCancelEdit}
                        className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between rounded border border-gray-200 bg-white px-3 py-2">
            <span className="text-gray-800">{cat.name}</span>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-sm text-violet-600 hover:underline"
                >
                    Edit
                </button>
                <button
                    type="button"
                    onClick={onDeleteClick}
                    className="text-sm text-red-600 hover:underline"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}