export const SYSTEM_PROMPT = `You are an expert at creating detailed music projects for Suno AI Custom Mode.

Your task is to take the user's vision and generate:
1. Complete lyrics with intelligent metatag structure
2. Detailed style description for the "Style of Music" field
3. Section-by-section breakdown with appropriate instrumentation tags

METATAG RULES:
1. Each section ([Intro], [Verse], [Chorus], etc.) should have a metatag describing the musical arrangement
2. Format: [Section: instrumentation details]
3. Examples:
   - [Intro: acoustic guitar, soft vocals]
   - [Verse 1: stripped back, vocals and piano only]
   - [Chorus: full band, electric guitar, powerful drums, energetic vocals]
   - [Bridge: guitar solo, no vocals, heavy drums]
   - [Outro: fade out, ambient synths]

4. Use descriptions like:
   - Instruments: "acoustic guitar", "electric bass", "808 drums", "synth pads"
   - Vocal instructions: "no vocals", "whispered vocals", "powerful vocals", "harmonies"
   - Dynamics: "stripped back", "full band", "build-up", "fade out"
   - Technical: "reverb heavy", "distorted", "clean", "lo-fi"

5. Adapt metatags based on section:
   - Verse: Usually more stripped back, focus on storytelling
   - Pre-Chorus: Build-up, adding elements
   - Chorus: Full power, all instruments
   - Bridge: Contrast, often instrumental or solo
   - Outro: Ending, fade or abrupt stop

Always respond in valid JSON format.`;

export function generateProjectPrompt(
  vision: string,
  genre: string,
  mood: string,
  tempo: string,
  wordDensity: string = 'medium'
): string {
  const densityInstructions = {
    'extreme-sparse': 'Use EXTREMELY sparse lyrics with very few words per line (2-4 words). Focus on powerful, impactful single words or short phrases. Maximum economy of language. Leave lots of space between phrases.',
    'low': 'Use sparse, concise lyrics with minimal words (3-6 words per line). Keep it simple and direct. Short, punchy phrases.',
    'medium': 'Use moderate lyric density with balanced phrasing (5-10 words per line). Natural conversational flow.',
    'high': 'Use dense, detailed lyrics with longer phrases and more words per line (10-15 words per line). Rich descriptions and elaborate phrasing.'
  };

  const densityGuidance = densityInstructions[wordDensity as keyof typeof densityInstructions] || densityInstructions.medium;

  return `Create a music project for Suno AI Custom Mode based on:

Vision: ${vision}
Genre: ${genre}
Mood: ${mood}
Tempo: ${tempo}
Word Density: ${wordDensity.toUpperCase()} - ${densityGuidance}

Generate:

1. LYRICS: Complete song lyrics with metatag structure
   - Use [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
   - Add [Instrumental] or other instructions where appropriate
   - Write creative, emotional lyrics matching the vision
   - IMPORTANT: Follow the word density guideline strictly for the verses and chorus
   - Each section should have a metatag describing instrumentation
   - Example format:
     [Intro: acoustic guitar, soft piano]
     [Instrumental]

     [Verse 1: acoustic guitar, gentle vocals]
     Lyrics here...

2. STYLE: Comma-separated style description for "Style of Music" field
   - Genre and subgenre
   - Specific instruments
   - Vocal style (gender, voice type, delivery)
   - Technical elements (effects, production)
   - Tempo and key if relevant
   - Mood and atmosphere

3. SECTIONS: Break down the structure with metatags

Respond in JSON format:
{
  "lyrics": "Complete lyrics with metatags...",
  "style": "comma, separated, style, elements...",
  "sections": [
    {
      "section": "Intro",
      "metatag": "[Intro: acoustic guitar, soft piano]",
      "lyrics": "[Instrumental]"
    }
  ],
  "suggestions": "Tips for the user..."
}`;
}

export function regenerateLyricsPrompt(
  currentLyrics: string,
  style: string,
  instructions?: string,
  wordDensity?: string
): string {
  let densityInstruction = '';
  if (wordDensity) {
    const densityInstructions = {
      'extreme-sparse': 'Use EXTREMELY sparse lyrics with very few words per line (2-4 words). Focus on powerful, impactful single words or short phrases.',
      'low': 'Use sparse, concise lyrics with minimal words (3-6 words per line). Keep it simple and direct.',
      'medium': 'Use moderate lyric density with balanced phrasing (5-10 words per line).',
      'high': 'Use dense, detailed lyrics with longer phrases (10-15 words per line).'
    };
    densityInstruction = `\nWord Density: ${wordDensity.toUpperCase()} - ${densityInstructions[wordDensity as keyof typeof densityInstructions] || densityInstructions.medium}`;
  }

  return `Regenerate the complete lyrics for this music project while maintaining consistency with the style.

Current Lyrics:
${currentLyrics}

Style: ${style}${densityInstruction}

${instructions ? `User Instructions: ${instructions}` : ''}

Generate new lyrics with the same structure (same sections) but different content. Keep the metatags format consistent with the style.${wordDensity ? ' Follow the word density guideline strictly for verses and chorus.' : ''}

Respond in JSON format:
{
  "lyrics": "Complete new lyrics with metatags...",
  "sections": [
    {
      "section": "Intro",
      "metatag": "[Intro: acoustic guitar, soft piano]",
      "lyrics": "[Instrumental]"
    }
  ]
}`;
}

export function regenerateMetatagsPrompt(
  lyrics: string,
  style: string
): string {
  return `Regenerate only the metatags for this music project. Keep the actual lyrics text EXACTLY the same, but update the instrumentation and arrangement instructions in the metatags.

Current Lyrics with Metatags:
${lyrics}

Style: ${style}

Generate new metatags that:
1. Match the style description
2. Create an interesting and dynamic arrangement
3. Use appropriate instrumentation for each section
4. Keep the actual lyric text unchanged

Respond in JSON format:
{
  "lyrics": "Complete lyrics with NEW metatags but SAME lyric text...",
  "sections": [
    {
      "section": "Intro",
      "metatag": "[Intro: new instrumentation here]",
      "lyrics": "exact same lyrics as before",
      "reasoning": "why these instruments work for this section"
    }
  ]
}`;
}

export function regenerateStylePrompt(
  lyrics: string,
  currentStyle: string,
  instructions?: string
): string {
  return `Regenerate the style description for this music project.

Lyrics:
${lyrics}

Current Style: ${currentStyle}

${instructions ? `User Instructions: ${instructions}` : ''}

Generate a new comma-separated style description that:
1. Matches the mood and content of the lyrics
2. Provides detailed instrumentation
3. Includes vocal style details
4. Specifies technical production elements

Respond in JSON format:
{
  "style": "new, comma, separated, style, description...",
  "reasoning": "why this style works for these lyrics"
}`;
}
