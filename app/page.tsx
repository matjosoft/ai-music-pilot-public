import Link from 'next/link';
import { Music, Sparkles, ArrowRight } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const ctaLink = session ? '/create' : '/login';
  const ctaText = session ? 'Create New Song' : 'Get Started';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full">
                <Music className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Suno AI Music Assistant
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Create better music with Suno AI using intelligent prompts, structured lyrics,
              and optimized style descriptions
            </p>
            <Link
              href={ctaLink}
              className="inline-flex items-center space-x-2 bg-primary hover:bg-blue-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Sparkles className="w-6 h-6" />
              <span>{ctaText}</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Intelligent Lyrics
              </h3>
              <p className="text-gray-600">
                Generate structured lyrics with metatags that guide Suno's AI on
                instrumentation for each section
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🎸</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Optimized Style
              </h3>
              <p className="text-gray-600">
                Detailed style descriptions covering genre, instruments, vocals, and production
                elements
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="bg-pink-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <span className="text-2xl">🔄</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">
                Easy Regeneration
              </h3>
              <p className="text-gray-600">
                Regenerate lyrics or just the metatags to fine-tune your song
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
            <div className="bg-white rounded-lg shadow-lg p-8 text-left">
              <ol className="space-y-6">
                <li className="flex items-start">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">Describe Your Vision</h4>
                    <p className="text-gray-600">
                      Tell us about your music idea - the theme, mood, and style you want
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">AI Generates Your Song</h4>
                    <p className="text-gray-600">
                      Our AI creates structured lyrics with metatags and a detailed style description
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 flex-shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-900">Copy to Suno Custom Mode</h4>
                    <p className="text-gray-600">
                      Simply copy the lyrics and style fields into Suno and create your music
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16">
            <Link
              href={ctaLink}
              className="inline-flex items-center space-x-2 bg-secondary hover:bg-purple-600 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>{session ? 'Start Creating' : 'Get Started Now'}</span>
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
