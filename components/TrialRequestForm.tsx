'use client'

import { useState, useEffect } from 'react'
import { Gift, Clock, CheckCircle, XCircle, Send, Loader2 } from 'lucide-react'
import type { TrialRequest } from '@/types'

const MAX_MESSAGE_LENGTH = 500

interface TrialRequestFormProps {
  onSuccess?: () => void
  compact?: boolean
}

export default function TrialRequestForm({ onSuccess, compact = false }: TrialRequestFormProps) {
  const [trialRequest, setTrialRequest] = useState<TrialRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchTrialRequest()
  }, [])

  const fetchTrialRequest = async () => {
    try {
      const response = await fetch('/api/trial-request')
      if (response.ok) {
        const data = await response.json()
        setTrialRequest(data.trialRequest)
      }
    } catch (error) {
      console.error('Failed to fetch trial request:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const response = await fetch('/api/trial-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit request')
        return
      }

      setTrialRequest(data.trialRequest)
      setSuccess(true)
      onSuccess?.()
    } catch (error) {
      setError('Failed to submit request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusDisplay = () => {
    if (!trialRequest) return null

    switch (trialRequest.status) {
      case 'pending':
        return {
          icon: <Clock className="w-5 h-5" />,
          text: 'Request Pending',
          description: 'Your trial request is being reviewed. We\'ll activate your trial soon!',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          textColor: 'text-yellow-400'
        }
      case 'approved':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          text: 'Trial Approved!',
          description: 'Your trial has been activated. Enjoy 30 free song generations!',
          bgColor: 'bg-neon-green/10',
          borderColor: 'border-neon-green/30',
          textColor: 'text-neon-green'
        }
      case 'rejected':
        return {
          icon: <XCircle className="w-5 h-5" />,
          text: 'Request Not Approved',
          description: 'Unfortunately, your trial request was not approved. Consider upgrading to Pro!',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400'
        }
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} flex items-center justify-center`}>
        <Loader2 className="w-6 h-6 animate-spin text-neon-purple" />
      </div>
    )
  }

  // Show status if request exists
  if (trialRequest) {
    const status = getStatusDisplay()
    if (!status) return null

    return (
      <div className={`${status.bgColor} ${status.borderColor} border rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
        <div className="flex items-start gap-3">
          <div className={`${status.textColor} flex-shrink-0 mt-0.5`}>
            {status.icon}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold ${status.textColor} mb-1`}>{status.text}</h3>
            <p className="text-gray-300 text-sm">{status.description}</p>
            {trialRequest.message && (
              <div className="mt-3 text-xs text-gray-400">
                <span className="font-medium">Your message:</span>
                <p className="mt-1 italic">"{trialRequest.message}"</p>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Submitted on {new Date(trialRequest.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show success message after submission
  if (success) {
    return (
      <div className="bg-neon-green/10 border border-neon-green/30 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0" />
          <div>
            <h3 className="font-bold text-neon-green mb-1">Request Submitted!</h3>
            <p className="text-gray-300 text-sm">
              Your trial request has been submitted. We'll review it and activate your trial soon!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show the request form
  return (
    <div className={`bg-gradient-to-br from-neon-purple/10 to-neon-cyan/10 border border-neon-purple/30 rounded-xl ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-start gap-3 mb-4">
        <Gift className="w-6 h-6 text-neon-purple flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-white mb-1">Request Free Trial</h3>
          <p className="text-gray-300 text-sm">
            Get <span className="font-bold text-neon-cyan">30 free song generations</span> to try all features!
            This is a limited-time offer.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="trial-message" className="block text-sm font-medium text-gray-300 mb-2">
            Message (optional)
          </label>
          <textarea
            id="trial-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={compact ? 2 : 3}
            placeholder="Tell us why you'd like to try the service, or share any feedback..."
            className="w-full bg-dark-lighter border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-neon-purple/50 focus:border-neon-purple transition-all resize-none"
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${message.length > MAX_MESSAGE_LENGTH * 0.9 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-neon-purple to-neon-magenta hover:from-neon-magenta hover:to-neon-cyan text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-neon-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Request Trial
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Trial requests are reviewed manually. Most requests are approved within 24 hours.
        </p>
      </form>
    </div>
  )
}
