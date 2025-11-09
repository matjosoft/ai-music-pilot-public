'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'

interface DeleteSongButtonProps {
  songId: string
}

export default function DeleteSongButton({ songId }: DeleteSongButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete song')
      }

      // Refresh the page to update the song list
      router.refresh()
    } catch (error) {
      console.error('Error deleting song:', error)
      alert('Failed to delete song. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Confirm'
          )}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium flex items-center gap-1"
      title="Delete song"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
