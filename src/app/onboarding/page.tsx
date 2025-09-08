'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type CategoryType = { id: string; name: string };

export default function OnboardingPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.data || []);
      const existing = await fetch('/api/user/categories');
      if (existing.ok) {
        const j = await existing.json();
        if (Array.isArray(j.categoryIds)) setSelected(j.categoryIds);
      }
    })();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 5 ? prev : [...prev, id]
    );
  };

  const save = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/user/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryIds: selected }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json();
      setError(j.error || 'Failed to save');
      return;
    }
    router.replace('/feed');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Pick your interests</h1>
        <p className="text-gray-300 mb-6">Choose up to 5 categories to personalize your feed.</p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {categories.map((c) => {
            const active = selected.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={`px-3 py-2 rounded border ${active ? 'bg-white text-black border-white' : 'bg-black/40 border-gray-700 hover:border-gray-500'}`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="mt-8 flex gap-3">
          <button onClick={save} disabled={loading || selected.length === 0} className="px-4 py-2 rounded bg-white text-black font-medium disabled:opacity-60">
            {loading ? 'Saving...' : 'Continue'}
          </button>
          <a href="/feed" className="px-4 py-2 rounded bg-gray-900 text-white">Skip</a>
        </div>
      </div>
    </div>
  );
}
