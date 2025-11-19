import type { Metadata } from 'next';
import './globals.css';
import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import UsageIndicator from '@/components/UsageIndicator';

export const metadata: Metadata = {
  title: 'AI Music Pilot',
  description: 'Your AI Co-Pilot for Music Creation - Navigate your music journey with AI-powered lyrics, prompts, and metatags for Suno AI',
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
      <body className="font-sans antialiased bg-dark-bg">
        <nav className="bg-dark-card/95 backdrop-blur-sm text-white shadow-xl border-b border-neon-purple/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-neon-purple via-neon-magenta to-neon-cyan bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                AI Music Pilot
              </Link>
              <div className="flex items-center space-x-6">
                {session ? (
                  <>
                    <Link href="/dashboard" className="hover:text-neon-purple transition-colors font-medium">
                      My Songs
                    </Link>
                    <Link href="/create" className="hover:text-neon-cyan transition-colors font-medium">
                      Create
                    </Link>
                    <UsageIndicator />
                    <span className="text-gray-400 text-sm">
                      {session.user.email}
                    </span>
                    <form action="/logout" method="POST">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan px-4 py-2 rounded-lg transition-all duration-300 font-medium"
                      >
                        Logout
                      </button>
                    </form>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan px-6 py-2 rounded-lg transition-all duration-300 font-bold shadow-neon-purple hover:shadow-neon-magenta"
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
