'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });
    setLoading(false);

    if (res?.error) {
      setError('Invalid email or password');
      return;
    }

    // Check categories and route appropriately
    const cats = await fetch('/api/user/categories').then((r) => r.json());
    const hasCats = Array.isArray(cats.categoryIds) && cats.categoryIds.length > 0;
    router.replace(hasCats ? '/feed' : '/onboarding');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-black/40 rounded-xl border border-gray-800 space-y-4">
        <h1 className="text-2xl font-semibold text-center mb-2">Log In</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 outline-none" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button disabled={loading} className="w-full py-2.5 rounded bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-60">
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        <p className="text-sm text-center text-gray-400">No account? <a href="/signup" className="text-white underline">Sign up</a></p>
      </form>
    </div>
  );
}
