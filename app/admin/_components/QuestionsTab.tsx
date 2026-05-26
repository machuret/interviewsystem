"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category, Question } from "../_types";
import { OPTION_LABEL } from "../_types";
import { ROLES } from "@/lib/roles";
type Role = typeof ROLES[number];
import Spinner from "./Spinner";

export default function QuestionsTab() {
  const [selectedRole, setSelectedRole]     = useState<Role>(ROLES[0]);
  const [categories, setCategories]         = useState<Category[]>([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [questions, setQuestions]           = useState<Question[]>([]);
  const [loading, setLoading]               = useState(false);
  const [showAddForm, setShowAddForm]       = useState(false);
  const [newQ, setNewQ]                     = useState({
    question_text: "",
    options: ["", "", "", ""],
    correct_answer_index: 0,
    category_id: "",
  });
  const [adding, setAdding]   = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    fetch(`/api/admin/categories?role_id=${selectedRole.id}`)
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
    setFilterCategory("");
  }, [selectedRole.id]);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ role_id: selectedRole.id });
    if (filterCategory) params.set("category_id", filterCategory);
    const res = await fetch(`/api/admin/questions?${params}`);
    if (res.ok) setQuestions(await res.json());
    setLoading(false);
  }, [selectedRole.id, filterCategory]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  async function addQuestion(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    if (newQ.options.some((o) => !o.trim())) {
      setAddError("All 4 options must be filled in.");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role_id: selectedRole.id,
        category_id: newQ.category_id || null,
        question_text: newQ.question_text,
        options: newQ.options,
        correct_answer_index: newQ.correct_answer_index,
      }),
    });
    if (res.ok) {
      setNewQ({ question_text: "", options: ["", "", "", ""], correct_answer_index: 0, category_id: "" });
      setShowAddForm(false);
      fetchQuestions();
    } else {
      const d = await res.json();
      setAddError(d.error || "Failed to add question.");
    }
    setAdding(false);
  }

  async function toggleActive(q: Question) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !q.active }),
    });
    fetchQuestions();
  }

  async function changeCategory(q: Question, category_id: string) {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: category_id || null }),
    });
    fetchQuestions();
  }

  async function deleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    fetchQuestions();
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
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

      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-auto text-sm py-2 px-3"
        >
          <option value="">All questions</option>
          <option value="base">Base only</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="bg-[#f97316] hover:bg-[#ea580c] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showAddForm ? "Cancel" : "+ Add Question"}
        </button>
        <span className="text-[#555] text-sm ml-auto">{questions.length} questions</span>
      </div>

      {showAddForm && (
        <form onSubmit={addQuestion} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-5 mb-6 space-y-4">
          <p className="text-white font-medium text-sm">New Question — {selectedRole.name}</p>
          {addError && <p className="text-red-400 text-xs">{addError}</p>}

          <div>
            <label className="text-[#555] text-xs uppercase tracking-wide block mb-1">Specialisation</label>
            <select
              value={newQ.category_id}
              onChange={(e) => setNewQ((q) => ({ ...q, category_id: e.target.value }))}
              className="w-full text-sm py-2 px-3"
            >
              <option value="">Base (shown for all specialisations)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[#555] text-xs uppercase tracking-wide block mb-1">Question</label>
            <textarea
              required
              rows={2}
              className="resize-none w-full text-sm"
              placeholder="Enter the question..."
              value={newQ.question_text}
              onChange={(e) => setNewQ((q) => ({ ...q, question_text: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[#555] text-xs uppercase tracking-wide block">
              Options — select the correct answer
            </label>
            {newQ.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  checked={newQ.correct_answer_index === i}
                  onChange={() => setNewQ((q) => ({ ...q, correct_answer_index: i }))}
                  className="accent-[#f97316] w-4 h-4 shrink-0"
                  title="Mark as correct answer"
                />
                <span className="text-[#f97316] font-bold text-sm w-5">{OPTION_LABEL(i)}.</span>
                <input
                  required
                  type="text"
                  className="flex-1 text-sm py-1.5 px-3"
                  placeholder={`Option ${OPTION_LABEL(i)}`}
                  value={opt}
                  onChange={(e) => {
                    const opts = [...newQ.options];
                    opts[i] = e.target.value;
                    setNewQ((q) => ({ ...q, options: opts }));
                  }}
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={adding}
            className="bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            {adding ? "Saving..." : "Save Question"}
          </button>
        </form>
      )}

      {loading ? (
        <Spinner />
      ) : questions.length === 0 ? (
        <p className="text-[#555] text-sm text-center py-8">No questions found.</p>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-[#141414] border rounded-xl p-4 ${q.active ? "border-[#2a2a2a]" : "border-[#1a1a1a] opacity-50"}`}
            >
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium mb-2 ${q.active ? "text-white" : "text-[#555]"}`}>
                    {q.question_text}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mb-2">
                    {q.options.map((opt, i) => (
                      <p
                        key={i}
                        className={`text-xs ${i === q.correct_answer_index ? "text-[#f97316] font-semibold" : "text-[#555]"}`}
                      >
                        {OPTION_LABEL(i)}. {opt}{i === q.correct_answer_index && " ✓"}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end shrink-0">
                  <select
                    value={q.category_id ?? ""}
                    onChange={(e) => changeCategory(q, e.target.value)}
                    className="text-xs py-1 px-2 w-44"
                  >
                    <option value="">Base</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleActive(q)}
                      className={`text-xs font-medium transition-colors ${
                        q.active ? "text-green-400 hover:text-[#555]" : "text-[#555] hover:text-green-400"
                      }`}
                    >
                      {q.active ? "Active" : "Inactive"}
                    </button>
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="text-[#555] hover:text-red-400 text-xs transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
