import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Suno AI Music Assistant',
  description: 'Create better music with Suno AI using intelligent prompts, structured lyrics, and optimized style descriptions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
