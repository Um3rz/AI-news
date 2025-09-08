'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || 'Failed to sign up');
      return;
    }

    // Auto-login
    const login = await signIn('credentials', { redirect: false, email, password });
    setLoading(false);
    if (login?.error) {
      setError('Account created but login failed. Please try logging in.');
      router.replace('/login');
      return;
    }

    router.replace('/onboarding');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-black/40 rounded-xl border border-gray-800 space-y-4">
        <h1 className="text-2xl font-semibold text-center mb-2">Create your account</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 outline-none" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 outline-none" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 outline-none" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </div>
        <button disabled={loading} className="w-full py-2.5 rounded bg-white text-black font-medium hover:bg-gray-200 disabled:opacity-60">
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
        <p className="text-sm text-center text-gray-400">Already have an account? <a href="/login" className="text-white underline">Log in</a></p>
      </form>
    </div>
  );
}
