'use client'

import Link from 'next/link'
import { Gift, Sparkles, Check } from 'lucide-react'
import TrialRequestForm from '@/components/TrialRequestForm'

export default function TrialPage() {
  return (
    <div className="min-h-screen bg-dark-bg py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-neon-purple hover:text-neon-cyan flex items-center mb-4 transition-colors">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-neon-purple/20 to-neon-magenta/20 p-3 rounded-xl border border-neon-purple/30">
              <Gift className="w-8 h-8 text-neon-purple" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Free Trial</h1>
              <p className="text-gray-400">Limited-time offer</p>
            </div>
          </div>
        </div>

        {/* Limited Time Offer Banner */}
        <div className="bg-gradient-to-r from-neon-magenta/20 via-neon-purple/20 to-neon-cyan/20 border border-neon-magenta/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-neon-magenta" />
            <span className="text-sm font-bold text-neon-magenta uppercase tracking-wider">Limited Time Offer</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Get 30 Free Song Generations
          </h2>
          <p className="text-gray-300 mb-4">
            We're offering a special trial period for new users! Request your free trial and unlock 30 song generations to experience all the features of AI Music Pilot.
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-gray-300">
              <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
              <span>30 complete song generations</span>
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
              <span>Full access to Custom and Artist modes</span>
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
              <span>Unlimited regenerations within your limit</span>
            </li>
            <li className="flex items-center gap-2 text-gray-300">
              <Check className="w-4 h-4 text-neon-green flex-shrink-0" />
              <span>No credit card required</span>
            </li>
          </ul>
        </div>

        {/* Trial Request Form */}
        <div className="mb-8">
          <TrialRequestForm />
        </div>

        {/* FAQ Section */}
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">How long does it take to get approved?</h4>
              <p className="text-gray-400 text-sm">Most trial requests are reviewed and approved within 24 hours.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">What happens after the trial ends?</h4>
              <p className="text-gray-400 text-sm">After using your 30 generations, you'll be moved to our free tier with 5 monthly generations, or you can upgrade to Pro for 100 generations per month.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Can I request a trial if I already have an account?</h4>
              <p className="text-gray-400 text-sm">Yes! Any free user can request a trial. Pro subscribers and users already on trial are not eligible.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-200 mb-1">Is there a time limit on the trial?</h4>
              <p className="text-gray-400 text-sm">The trial gives you 30 generations to use at your own pace. There's no strict time limit.</p>
            </div>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 mb-4">
            Want unlimited access right away?
          </p>
          <Link
            href="/subscription"
            className="inline-flex items-center space-x-2 bg-dark-card border border-neon-purple/50 hover:border-neon-purple hover:bg-neon-purple/10 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
          >
            <span>View Pro Plans</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
