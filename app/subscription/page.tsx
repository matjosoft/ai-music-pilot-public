'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

interface UsageStats {
  currentPeriodUsage: number
  limit: number
  remaining: number
  periodStart: string | null
  periodEnd: string | null
  tier: string
  isTestUser: boolean
  isInTrial: boolean
}

export default function SubscriptionPage() {
  const [usage, setUsage] = useState<UsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchUsage()

    // Check for success/cancel query params from Stripe redirect
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success) {
      // Show success message (could add a toast notification here)
      console.log('Payment successful!')
      // Refresh usage to show new tier
      setTimeout(() => fetchUsage(), 1000)
    } else if (canceled) {
      console.log('Payment canceled')
    }
  }, [searchParams])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
      if (response.status === 401) {
        router.push('/login')
        return
      }
      if (response.ok) {
        const data = await response.json()
        setUsage(data.usage)
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'test':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'pro':
        return 'Pro'
      case 'test':
        return 'Test User'
      default:
        return 'Free'
    }
  }

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout. Please try again.')
      setCheckoutLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }

      const data = await response.json()

      // Redirect to Stripe Customer Portal
      window.location.href = data.url
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Failed to open subscription management. Please try again.')
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading subscription details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!usage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">Failed to load subscription information.</p>
            <button
              onClick={fetchUsage}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const usagePercentage = (usage.currentPeriodUsage / usage.limit) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-purple-600 hover:text-purple-700 flex items-center mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Subscription & Usage</h1>
          <p className="text-gray-600 mt-2">Manage your plan and track your usage</p>
        </div>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTierBadgeColor(usage.tier)}`}>
                  {getTierName(usage.tier)}
                </span>
                {usage.isInTrial && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                    Trial
                  </span>
                )}
                {usage.isTestUser && (
                  <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                    Test Account
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {usage.tier === 'free' && 'Limited features • 5 generations per month'}
                {usage.tier === 'pro' && 'Full access • 100 generations per month • $5/month'}
                {usage.tier === 'test' && 'Unlimited access for testing'}
              </p>
            </div>
            {usage.tier === 'free' && !usage.isTestUser && (
              <div>
                <button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              </div>
            )}
            {usage.tier === 'pro' && !usage.isTestUser && usage.isInTrial === false && (
              <div>
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {portalLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Usage This Period</h2>

          {/* Usage bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Generations Used</span>
              <span className="text-sm font-medium text-gray-900">
                {usage.isTestUser ? (
                  <span className="text-green-600">Unlimited</span>
                ) : (
                  <>{usage.currentPeriodUsage} / {usage.limit}</>
                )}
              </span>
            </div>
            {!usage.isTestUser && (
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    usagePercentage >= 100
                      ? 'bg-red-500'
                      : usagePercentage >= 80
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Remaining</div>
              <div className="text-2xl font-bold text-gray-900">
                {usage.isTestUser ? '∞' : usage.remaining}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Period Start</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(usage.periodStart)}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Period End</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(usage.periodEnd)}
              </div>
            </div>
          </div>

          {!usage.isTestUser && usage.remaining === 0 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">
                You've reached your monthly limit. Upgrade to Pro for 100 generations per month!
              </p>
            </div>
          )}
        </div>

        {/* Pricing Plans (for free users) */}
        {usage.tier === 'free' && !usage.isTestUser && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upgrade Your Plan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free Plan */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  $0<span className="text-lg text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    5 generations per month
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Basic features
                  </li>
                </ul>
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 font-bold py-2 px-4 rounded-lg cursor-not-allowed"
                >
                  Current Plan
                </button>
              </div>

              {/* Pro Plan */}
              <div className="border-2 border-purple-600 rounded-lg p-6 bg-gradient-to-br from-purple-50 to-indigo-50 relative">
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                  RECOMMENDED
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
                <div className="text-3xl font-bold text-purple-600 mb-4">
                  $5<span className="text-lg text-gray-600">/month</span>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    100 generations per month
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Unlimited regenerations
                  </li>
                  <li className="flex items-center text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Priority support
                  </li>
                </ul>
                <button
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? 'Loading...' : 'Upgrade to Pro'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Test user notice */}
        {usage.isTestUser && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-600 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-bold text-yellow-900 mb-1">Test Account</h3>
                <p className="text-yellow-800 text-sm">
                  This is a test account with unlimited access for development and testing purposes.
                  Usage tracking and limits are disabled for this account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
