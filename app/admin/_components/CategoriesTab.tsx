"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category } from "../_types";
import { ROLES } from "@/lib/roles";
type Role = typeof ROLES[number];
import Spinner from "./Spinner";

export default function CategoriesTab() {
  const [selectedRole, setSelectedRole] = useState<Role>(ROLES[0]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [loading, setLoading]           = useState(false);
  const [newName, setNewName]           = useState("");
  const [adding, setAdding]             = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editName, setEditName]         = useState("");

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/categories?role_id=${selectedRole.id}`);
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }, [selectedRole.id]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role_id: selectedRole.id, name: newName.trim() }),
    });
    if (res.ok) { setNewName(""); fetchCategories(); }
    setAdding(false);
  }

  async function toggleActive(cat: Category) {
    await fetch(`/api/admin/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !cat.active }),
    });
    fetchCategories();
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    fetchCategories();
  }

  async function deleteCategory(id: string) {
    if (!confirm("Delete this category? Questions assigned to it will become base questions.")) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex gap-2 mb-6 flex-wrap">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setSelectedRole(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              selectedRole.id === r.id
                ? "bg-[#f97316] border-[#f97316] text-white"
                : "bg-[#141414] border-[#2a2a2a] text-[#777] hover:text-white"
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <form onSubmit={addCategory} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder={`New specialisation for ${selectedRole.name}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 text-sm py-2 px-3"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Add
        </button>
      </form>

      {loading ? (
        <Spinner />
      ) : categories.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-8">
          No specialisations yet for {selectedRole.name}. Add one above.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3"
            >
              {editingId === cat.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(cat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 text-sm py-1 px-2"
                  />
                  <button onClick={() => saveEdit(cat.id)} className="text-[#f97316] text-sm font-medium hover:text-white">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-[#555] text-sm hover:text-white">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className={`flex-1 text-sm font-medium ${cat.active ? "text-white" : "text-[#555] line-through"}`}>
                    {cat.name}
                  </span>
                  <span className="text-[#555] text-xs">{cat.slug}</span>
                  <button
                    onClick={() => { setEditingId(cat.id); setEditName(cat.name); }}
                    className="text-[#555] hover:text-[#f97316] text-xs transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleActive(cat)}
                    className={`text-xs font-medium transition-colors ${
                      cat.active ? "text-green-400 hover:text-[#555]" : "text-[#555] hover:text-green-400"
                    }`}
                  >
                    {cat.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id)}
                    className="text-[#555] hover:text-red-400 text-xs transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
