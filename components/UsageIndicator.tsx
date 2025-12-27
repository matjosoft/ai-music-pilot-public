'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UsageData {
  remaining: number
  limit: number
  tier: string
  periodEnd: string | null
  isTestUser: boolean
  isInTrial?: boolean
}

export default function UsageIndicator() {
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsage()

    // Listen for usage update events
    const handleUsageUpdate = () => {
      fetchUsage()
    }

    window.addEventListener('usageUpdated', handleUsageUpdate)

    return () => {
      window.removeEventListener('usageUpdated', handleUsageUpdate)
    }
  }, [])

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/usage')
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

  if (loading) {
    return (
      <div className="text-sm text-purple-200">
        Loading...
      </div>
    )
  }

  if (!usage) return null

  // Test users see unlimited badge
  if (usage.isTestUser) {
    return (
      <Link href="/subscription" className="flex items-center space-x-2 text-sm hover:text-purple-200 transition-colors">
        <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
          TEST USER
        </span>
        <span className="text-purple-200">Unlimited</span>
      </Link>
    )
  }

  // Trial users see trial badge with remaining count
  if (usage.tier === 'trial') {
    const percentage = (usage.remaining / usage.limit) * 100
    const isLow = percentage <= 20
    const isMedium = percentage <= 50

    const getStatusColor = () => {
      if (isLow) return 'text-red-300'
      if (isMedium) return 'text-yellow-300'
      return 'text-cyan-300'
    }

    return (
      <Link href="/subscription" className="flex items-center space-x-2 text-sm hover:text-purple-200 transition-colors">
        <span className="bg-cyan-500 text-black px-2 py-1 rounded text-xs font-bold">
          TRIAL
        </span>
        <span className={getStatusColor()}>
          {usage.remaining}/{usage.limit}
        </span>
      </Link>
    )
  }

  // Calculate percentage for color coding
  const percentage = (usage.remaining / usage.limit) * 100
  const isLow = percentage <= 20
  const isMedium = percentage <= 50

  const getStatusColor = () => {
    if (isLow) return 'text-red-300'
    if (isMedium) return 'text-yellow-300'
    return 'text-green-300'
  }

  const getBadgeColor = () => {
    if (isLow) return 'bg-red-500'
    if (isMedium) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <Link
      href="/subscription"
      className="flex items-center space-x-2 text-sm hover:text-purple-200 transition-colors group"
      title="Click to manage subscription"
    >
      <div className="flex items-center space-x-1">
        <div className={`w-2 h-2 rounded-full ${getBadgeColor()} animate-pulse`} />
        <span className={getStatusColor()}>
          {usage.remaining}/{usage.limit}
        </span>
      </div>
      <span className="text-purple-200 text-xs uppercase">
        {usage.tier}
      </span>
    </Link>
  )
}
