'use client';

import { Info } from 'lucide-react';

export default function SunoInstructions() {
  return (
    <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-2xl p-6">
      <div className="flex items-start space-x-3">
        <Info className="w-6 h-6 text-neon-cyan flex-shrink-0 mt-0.5" />
        <div className="space-y-3">
          <h3 className="font-semibold text-white text-lg">
            How to Use in Suno Custom Mode
          </h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start">
              <span className="font-bold mr-2 text-neon-cyan">1.</span>
              <span>Go to Suno.ai and select <strong className="text-white">Custom Mode</strong></span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2 text-neon-cyan">2.</span>
              <span>Click <strong className="text-white">"Copy Lyrics"</strong> above and paste into the <strong className="text-white">"Song Description"</strong> field in Suno</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2 text-neon-cyan">3.</span>
              <span>Click <strong className="text-white">"Copy Style"</strong> above and paste into the <strong className="text-white">"Style of Music"</strong> field in Suno</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2 text-neon-cyan">4.</span>
              <span>Click <strong className="text-white">Create</strong> in Suno and wait for your AI-generated music!</span>
            </li>
          </ol>
          <div className="mt-4 pt-4 border-t border-neon-cyan/30">
            <p className="text-xs text-gray-400">
              <strong className="text-neon-cyan">Pro Tip:</strong> The metatags in brackets (like [Intro: acoustic guitar]) guide Suno's
              AI to use specific instruments and production styles for each section of your song.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
