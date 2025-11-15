import type { Metadata } from 'next';
import './globals.css';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import UsageIndicator from '@/components/UsageIndicator';

export const metadata: Metadata = {
  title: 'Suno AI Music Assistant',
  description: 'Create better music with Suno AI using intelligent prompts, structured lyrics, and optimized style descriptions',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <nav className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-xl font-bold hover:text-purple-200 transition-colors">
                Suno Assistant
              </Link>
              <div className="flex items-center space-x-4">
                {session ? (
                  <>
                    <Link href="/dashboard" className="hover:text-purple-200 transition-colors">
                      My Songs
                    </Link>
                    <Link href="/create" className="hover:text-purple-200 transition-colors">
                      Create
                    </Link>
                    <UsageIndicator />
                    <span className="text-purple-200">
                      {session.user.email}
                    </span>
                    <form action="/logout" method="POST">
                      <button
                        type="submit"
                        className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors"
                      >
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
