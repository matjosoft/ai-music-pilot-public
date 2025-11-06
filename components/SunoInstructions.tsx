'use client';

import { Info } from 'lucide-react';

export default function SunoInstructions() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-3">
          <h3 className="font-semibold text-blue-900 text-lg">
            How to Use in Suno Custom Mode
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Go to Suno.ai and select <strong>Custom Mode</strong></span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Click <strong>"Copy Lyrics"</strong> above and paste into the <strong>"Song Description"</strong> field in Suno</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Click <strong>"Copy Style"</strong> above and paste into the <strong>"Style of Music"</strong> field in Suno</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Click <strong>Create</strong> in Suno and wait for your AI-generated music!</span>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              <strong>Pro Tip:</strong> The metatags in brackets (like [Intro: acoustic guitar]) guide Suno's
              AI to use specific instruments and production styles for each section of your song.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
