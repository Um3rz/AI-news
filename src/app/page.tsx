'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/feed');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Navigation */}
      <header className="border-b border-gray-800/60 bg-black/30 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-white text-black grid place-items-center font-bold">AI</div>
            <span className="text-lg font-semibold tracking-tight">News</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-md font-medium text-white/90 hover:text-white">
              Log In
            </Link>
            <Link href="/signup" className="px-4 py-2 rounded-md font-medium bg-white text-black hover:bg-gray-200">
              Sign Up
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4">
        <section className="py-20 md:py-28 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Your personalized, AI‑curated news feed
            </h1>
            <p className="mt-4 md:mt-6 text-lg md:text-xl text-gray-300">
              Stay ahead with distilled insights from top sources. We fetch, summarize, and categorize news so you can focus on what matters.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex items-center justify-center gap-3">
                <Link 
                  href="/signup" 
                  className="px-8 py-3 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Sign up free
                </Link>
                <Link 
                  href="/login" 
                  className="px-8 py-3 rounded-md font-semibold border border-gray-800 bg-black/20 hover:bg-gray-800 transition-colors"
                >
                  Learn more
                </Link>
              </div>
              <p className="text-sm text-gray-500">No credit card required</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}