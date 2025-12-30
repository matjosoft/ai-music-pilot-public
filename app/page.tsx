import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ArrowRight, Shield, DollarSign, Youtube, Zap, BookOpen } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const ctaLink = session ? '/create' : '/login';
  const ctaText = session ? 'Start Creating' : 'Create Your First Prompt';

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="mb-20 text-center">
            <div className="flex justify-center mb-8">
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-white/95 via-gray-50/90 to-white/95 p-4 shadow-2xl ring-4 ring-neon-purple/20 hover:ring-neon-purple/40 transition-all duration-300 overflow-hidden">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  <Image
                    src="/assets/aimp-logo.png"
                    alt="AiMP - AI Music Pilot Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-6 tracking-tight">
              Craft Perfect Prompts
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-magenta to-neon-cyan">
                for Suno AI
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-2 max-w-3xl mx-auto leading-relaxed">
              Your AI-powered songwriting assistant — Generate professional lyrics, style prompts, and metatags optimized for Suno's Custom Mode
            </p>
            <p className="text-sm text-gray-500 mb-10">
              Suno account required
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 bg-dark-card px-4 py-2 rounded-full border border-neon-green/30">
                <Shield className="w-5 h-5 text-neon-green" />
                <span className="text-gray-200 text-sm font-medium">Copyright Free</span>
              </div>
              <div className="flex items-center gap-2 bg-dark-card px-4 py-2 rounded-full border border-neon-cyan/30">
                <DollarSign className="w-5 h-5 text-neon-cyan" />
                <span className="text-gray-200 text-sm font-medium">Commercial Use</span>
              </div>
              <div className="flex items-center gap-2 bg-dark-card px-4 py-2 rounded-full border border-neon-magenta/30">
                <Youtube className="w-5 h-5 text-neon-magenta" />
                <span className="text-gray-200 text-sm font-medium">YouTube Safe</span>
              </div>
            </div>

            <Link
              href={ctaLink}
              className="inline-flex items-center space-x-3 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white font-bold py-5 px-10 rounded-xl text-xl transition-all duration-300 shadow-neon-purple hover:shadow-neon-magenta transform hover:-translate-y-1 hover:scale-105"
            >
              <Sparkles className="w-7 h-7" />
              <span>{ctaText}</span>
              <ArrowRight className="w-7 h-7" />
            </Link>

            <div className="mt-8">
              <Link
                href="/about"
                className="inline-flex items-center space-x-3 bg-dark-card border-2 border-neon-cyan/50 hover:border-neon-cyan hover:bg-neon-cyan/10 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-neon-cyan/30"
              >
                <BookOpen className="w-6 h-6 text-neon-cyan" />
                <span>Read More About Features &amp; Pricing</span>
              </Link>
            </div>

            <div className="mt-6">
              <Link
                href="/about#video-tutorial"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-neon-purple hover:to-neon-cyan transition-all duration-300 text-base group"
              >
                <span>Watch a quick demo video</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-dark-card p-8 rounded-2xl shadow-xl border border-neon-purple/20 hover:border-neon-purple/50 transition-all duration-300 hover:shadow-neon-purple">
              <div className="bg-gradient-to-br from-neon-purple/20 to-neon-magenta/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto border border-neon-purple/30">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">
                Intelligent Lyrics
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Generate structured lyrics with metatags that guide Suno's AI on
                instrumentation for each section
              </p>
            </div>

            <div className="bg-dark-card p-8 rounded-2xl shadow-xl border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-neon-cyan">
              <div className="bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto border border-neon-cyan/30">
                <span className="text-4xl">🎸</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">
                Optimized Style
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Detailed style descriptions covering genre, instruments, vocals, and production
                elements
              </p>
            </div>

            <div className="bg-dark-card p-8 rounded-2xl shadow-xl border border-neon-magenta/20 hover:border-neon-magenta/50 transition-all duration-300 hover:shadow-neon-magenta">
              <div className="bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 w-16 h-16 rounded-xl flex items-center justify-center mb-6 mx-auto border border-neon-magenta/30">
                <span className="text-4xl">🔄</span>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-white">
                Easy Regeneration
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Regenerate lyrics or just the metatags to fine-tune your song
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 text-center">How It Works</h2>
            <p className="text-xl text-gray-400 mb-12 text-center max-w-2xl mx-auto">
              Three simple steps to generate Suno-ready prompts
            </p>
            <div className="bg-dark-card rounded-2xl shadow-2xl p-8 md:p-12 border border-gray-800">
              <div className="space-y-8">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <span className="bg-gradient-to-br from-neon-purple to-neon-magenta text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-neon-purple">
                      1
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-white mb-2">Describe Your Vision</h4>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      Tell us about your music idea - the theme, mood, genre, and style you want. Be as detailed or simple as you like.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-neon-cyan rotate-90 md:rotate-0" />
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <span className="bg-gradient-to-br from-neon-cyan to-neon-purple text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-neon-cyan">
                      2
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-white mb-2">
                      <Zap className="inline w-6 h-6 text-neon-cyan mr-2" />
                      AI Generates Your Song
                    </h4>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      Our AI creates structured lyrics with metatags and a detailed style description, optimized for Suno AI.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-neon-magenta rotate-90 md:rotate-0" />
                </div>

                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0">
                    <span className="bg-gradient-to-br from-neon-magenta to-neon-cyan text-white w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-neon-magenta">
                      3
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-2xl text-white mb-2">Copy to Suno Custom Mode</h4>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      Simply copy the lyrics and style fields into Suno and create your music. Regenerate any section until it's perfect.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-neon-purple/10 via-neon-magenta/10 to-neon-cyan/10 rounded-3xl p-12 border border-neon-purple/30">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Supercharge Your Suno Workflow?
              </h3>
              <p className="text-xl text-gray-400 mb-8">
                Join creators crafting professional prompts and lyrics for Suno AI
              </p>
              <Link
                href={ctaLink}
                className="inline-flex items-center space-x-3 bg-gradient-to-r from-neon-magenta to-neon-cyan hover:from-neon-cyan hover:to-neon-purple text-white font-bold py-5 px-10 rounded-xl text-xl transition-all duration-300 shadow-neon-magenta hover:shadow-neon-cyan transform hover:-translate-y-1 hover:scale-105"
              >
                <span>{session ? 'Start Creating' : 'Get Started Free'}</span>
                <ArrowRight className="w-7 h-7" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
