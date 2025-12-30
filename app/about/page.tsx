import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Music, RefreshCw, PenTool, Crown, Settings, CreditCard, LayoutDashboard, PlusCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-neon-purple hover:text-neon-cyan flex items-center mb-6 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple via-neon-magenta to-neon-cyan">AI Music Pilot</span>
          </h1>
          <p className="text-xl text-gray-400">
            Your AI-powered co-pilot for creating amazing music with Suno AI
          </p>
        </div>

        {/* What is AI Music Pilot */}
        <section className="bg-dark-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-neon-purple/20 to-neon-magenta/20 w-12 h-12 rounded-xl flex items-center justify-center border border-neon-purple/30">
              <Sparkles className="w-6 h-6 text-neon-purple" />
            </div>
            <h2 className="text-2xl font-bold text-white">What is AI Music Pilot?</h2>
          </div>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              AI Music Pilot is a <strong className="text-white">songwriting assistant</strong> designed specifically for <strong className="text-neon-cyan">Suno AI</strong> users. It helps you create professional-quality prompts, lyrics, and style descriptions that work perfectly with Suno&apos;s Custom Mode.
            </p>
            <p>
              Instead of struggling to write the perfect prompt, our AI generates structured lyrics with intelligent <strong className="text-white">metatags</strong> - special instructions that tell Suno exactly how each section should sound. You also get a complete style description covering genre, instruments, vocals, and production style.
            </p>
            <p>
              Simply describe your music vision, select a genre, mood, and tempo, and let AI Music Pilot do the rest. Then copy the generated content directly into Suno&apos;s Custom Mode to create your music!
            </p>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="bg-dark-card rounded-2xl shadow-xl p-8 mb-8 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-neon-purple/20 to-neon-magenta/20 w-12 h-12 rounded-xl flex items-center justify-center border border-neon-purple/30">
              <Crown className="w-6 h-6 text-neon-purple" />
            </div>
            <h2 className="text-2xl font-bold text-white">Subscription Plans</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="bg-dark-lighter rounded-xl p-6 border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
              <p className="text-3xl font-bold text-white mb-4">$0<span className="text-lg text-gray-400">/month</span></p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  5 song generations per month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  All basic features
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  Perfect for trying out the app
                </li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-neon-purple/10 to-neon-magenta/10 rounded-xl p-6 border-2 border-neon-purple relative">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-neon-purple to-neon-magenta text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro Plan</h3>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-neon-magenta mb-4">
                $5<span className="text-lg text-gray-400">/month</span>
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <strong className="text-white">99 song generations per month</strong>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  Unlimited regenerations
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  Priority support
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  All premium features
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Recent Features */}
        <section className="bg-dark-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 w-12 h-12 rounded-xl flex items-center justify-center border border-neon-cyan/30">
              <Sparkles className="w-6 h-6 text-neon-cyan" />
            </div>
            <h2 className="text-2xl font-bold text-white">New Features</h2>
          </div>

          <div className="space-y-6">
            {/* Song Versions & Regeneration */}
            <div className="bg-dark-lighter rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-6 h-6 text-neon-magenta" />
                <h3 className="text-xl font-bold text-white">Regenerate &amp; Song Versions</h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Not happy with a generation? Now you can <strong className="text-white">regenerate</strong> your song with different parameters! Each regeneration creates a new <strong className="text-white">version</strong> of your song, and you can switch between versions at any time.
              </p>
              <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2"><strong className="text-neon-cyan">How to use:</strong></p>
                <ol className="text-sm text-gray-300 list-decimal list-inside space-y-1">
                  <li>Open any of your saved songs</li>
                  <li>Click the <strong className="text-white">&quot;Regenerate&quot;</strong> button</li>
                  <li>Adjust parameters like genre, mood, or tempo if desired</li>
                  <li>A new version will be created automatically</li>
                  <li>Use the <strong className="text-white">version dropdown</strong> to switch between versions</li>
                </ol>
              </div>
            </div>

            {/* Custom Lyrics */}
            <div className="bg-dark-lighter rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <PenTool className="w-6 h-6 text-neon-cyan" />
                <h3 className="text-xl font-bold text-white">Use Your Own Lyrics</h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                Already have lyrics you love? Now you can <strong className="text-white">bring your own lyrics</strong> and let AI Music Pilot enhance them with professional metatags and style descriptions optimized for Suno AI.
              </p>
              <div className="bg-dark-bg rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-2"><strong className="text-neon-cyan">How to use:</strong></p>
                <ol className="text-sm text-gray-300 list-decimal list-inside space-y-1">
                  <li>Go to the <strong className="text-white">Create</strong> page</li>
                  <li>Check the <strong className="text-white">&quot;Use Custom Lyrics&quot;</strong> option</li>
                  <li>Paste your existing lyrics into the text area</li>
                  <li>Fill in genre, mood, and tempo preferences</li>
                  <li>AI will add metatags and create a matching style description</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Video Tutorial */}
        <section id="video-tutorial" className="bg-dark-card rounded-2xl shadow-xl p-8 mb-8 border border-neon-purple/30 scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-neon-magenta/20 to-neon-purple/20 w-12 h-12 rounded-xl flex items-center justify-center border border-neon-magenta/30">
              <Sparkles className="w-6 h-6 text-neon-magenta" />
            </div>
            <h2 className="text-2xl font-bold text-white">See AI Music Pilot in Action</h2>
          </div>

          <div className="space-y-4">
            <p className="text-gray-300 leading-relaxed">
              Watch this quick 2-minute walkthrough to see how AI Music Pilot helps you create professional Suno prompts and lyrics in seconds.
            </p>

            <div className="max-w-3xl mx-auto">
              <a
                href="https://youtu.be/5_bjeBFxWME"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-neon-purple/30 group hover:border-neon-magenta/50 transition-all duration-300"
              >
                <Image
                  src="/assets/youtube-thumbnail.png"
                  alt="Watch AI Music Pilot Demo - Tutorial Video"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <div className="bg-neon-magenta/90 group-hover:bg-neon-magenta rounded-full p-6 group-hover:scale-110 transition-all duration-300 shadow-2xl">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* Navigation Guide */}
        <section className="bg-dark-card rounded-2xl shadow-xl p-8 mb-8 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-neon-magenta/20 to-neon-cyan/20 w-12 h-12 rounded-xl flex items-center justify-center border border-neon-magenta/30">
              <Settings className="w-6 h-6 text-neon-magenta" />
            </div>
            <h2 className="text-2xl font-bold text-white">Navigation Guide</h2>
          </div>

          <div className="space-y-4">
            {/* Menu Items */}
            <div className="grid gap-4">
              <div className="flex items-start gap-4 bg-dark-lighter rounded-lg p-4 border border-gray-700">
                <div className="bg-neon-purple/20 p-2 rounded-lg border border-neon-purple/30">
                  <LayoutDashboard className="w-5 h-5 text-neon-purple" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">My Songs</h4>
                  <p className="text-gray-400 text-sm">
                    View all your saved songs in one place. See version counts, switch between versions, and access any song to edit or copy its content.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-dark-lighter rounded-lg p-4 border border-gray-700">
                <div className="bg-neon-cyan/20 p-2 rounded-lg border border-neon-cyan/30">
                  <PlusCircle className="w-5 h-5 text-neon-cyan" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Create</h4>
                  <p className="text-gray-400 text-sm">
                    Start a new song project. Describe your vision, select genre, mood, and tempo. Optionally use your own custom lyrics.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 bg-dark-lighter rounded-lg p-4 border border-gray-700">
                <div className="bg-neon-magenta/20 p-2 rounded-lg border border-neon-magenta/30">
                  <Music className="w-5 h-5 text-neon-magenta" />
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Usage Indicator (in navigation bar)</h4>
                  <p className="text-gray-400 text-sm">
                    Shows how many generations you have remaining this month. Click it to go to your subscription page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Manage Subscription */}
        <section className="bg-gradient-to-r from-neon-purple/10 via-neon-magenta/10 to-neon-cyan/10 rounded-2xl p-8 mb-8 border border-neon-purple/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-neon-purple/30 to-neon-magenta/30 w-12 h-12 rounded-xl flex items-center justify-center border border-neon-purple/50">
              <CreditCard className="w-6 h-6 text-neon-purple" />
            </div>
            <h2 className="text-2xl font-bold text-white">How to Manage Your Subscription</h2>
          </div>

          <div className="bg-dark-card rounded-xl p-6 border border-gray-700">
            <p className="text-gray-300 mb-4">
              To view your usage, upgrade your plan, or manage your subscription:
            </p>
            <ol className="text-gray-300 list-decimal list-inside space-y-3 mb-6">
              <li>
                <strong className="text-white">Click the usage indicator</strong> in the top navigation bar (shows your remaining generations like &quot;45/99&quot;)
              </li>
              <li>
                This takes you to the <strong className="text-white">Subscription &amp; Usage</strong> page
              </li>
              <li>
                Here you can:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-400">
                  <li>See your current plan and usage statistics</li>
                  <li>View when your billing period resets</li>
                  <li><strong className="text-white">Upgrade to Pro</strong> if you&apos;re on the free plan</li>
                  <li><strong className="text-white">Manage Subscription</strong> to update payment method or cancel (Pro users)</li>
                </ul>
              </li>
            </ol>
            <Link
              href="/subscription"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-neon-purple hover:shadow-neon-magenta"
            >
              <CreditCard className="w-5 h-5" />
              Go to Subscription Page
            </Link>
          </div>
        </section>

        {/* Getting Started CTA */}
        <section className="text-center">
          <div className="bg-dark-card rounded-2xl p-8 border border-gray-800">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to Create Amazing Music?</h3>
            <p className="text-gray-400 mb-6">
              Start generating professional prompts and lyrics for Suno AI today!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-magenta to-neon-cyan hover:from-neon-cyan hover:to-neon-purple text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-neon-magenta hover:shadow-neon-cyan"
            >
              <Sparkles className="w-6 h-6" />
              Start Creating
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
