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
   - [Chorus: full band, electric guitar, powerful drums, energetic vocals, backing vocals]
   - [Bridge: guitar solo, no vocals, heavy drums]
   - [Outro: fade out, ambient synths]

4. Use descriptions like:
   - Instruments: "acoustic guitar", "electric bass", "808 drums", "synth pads"
   - Vocal instructions: "no vocals", "whispered vocals", "powerful vocals", "harmonies", "backing vocals"
   - Dynamics: "stripped back", "full band", "build-up", "fade out"
   - Technical: "reverb heavy", "distorted", "clean", "lo-fi"

5. BACKING VOCALS:
   - Use parentheses to indicate backing vocals in lyrics
   - Example: "I'm walking on sunshine (yeah yeah)"
   - Example: "I'm walking on sunshine (sunshine)"
   - Commonly used in chorus sections to add depth and energy
   - Can include harmonies, ad-libs, echoes, or call-and-response
   - Include "backing vocals" in the metatag when using this feature

6. Adapt metatags based on section:
   - Verse: Usually more stripped back, focus on storytelling
   - Pre-Chorus: Build-up, adding elements
   - Chorus: Full power, all instruments, often with backing vocals
   - Bridge: Contrast, often instrumental or solo
   - Outro: Ending, fade or abrupt stop

Always respond in valid JSON format.`;

export function generateProjectPrompt(
  vision: string,
  genre: string,
  mood: string,
  tempo: string,
  wordDensity: string = 'medium',
  instrumental: boolean = false
): string {
  // If instrumental mode is enabled, generate a simple instrumental-only prompt
  if (instrumental) {
    return `Create an instrumental music project for Suno AI Custom Mode based on:

Vision: ${vision}
Genre: ${genre}
Mood: ${mood}
Tempo: ${tempo}

IMPORTANT: This is an INSTRUMENTAL track with NO LYRICS. Generate only a single [Instrumental] tag.

Generate:

1. LYRICS: Only the following:
   [Instrumental]

2. STYLE: Comma-separated style description for "Style of Music" field
   - Genre and subgenre
   - Specific instruments
   - Instrumental focus (no vocals)
   - Technical elements (effects, production)
   - Tempo and key if relevant
   - Mood and atmosphere
   - Emphasize that this is instrumental music

Respond in JSON format:
{
  "songs": [
    {
      "title": "Generated title based on the vision",
      "lyrics": "[Instrumental]",
      "style": "instrumental, ${genre.toLowerCase()}, ${mood.toLowerCase()}, comma, separated, style, elements..."
    }
  ]
}`;
  }

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
   - Use backing vocals in parentheses where appropriate (especially in chorus sections)
   - Each section should have a metatag describing instrumentation
   - Example format:
     [Intro: acoustic guitar, soft piano]
     [Instrumental]

     [Verse 1: acoustic guitar, gentle vocals]
     Lyrics here...

     [Chorus: full band, backing vocals, harmonies]
     Main lyrics here (backing vocals here)
     Add backing vocals using parentheses (yeah yeah)

2. STYLE: Comma-separated style description for "Style of Music" field
   - Genre and subgenre
   - Specific instruments
   - Vocal style (gender, voice type, delivery)
   - Technical elements (effects, production)
   - Tempo and key if relevant
   - Mood and atmosphere

3. TITLE: Create a compelling song title that matches the vision and mood

Respond in JSON format:
{
  "songs": [
    {
      "title": "Song title here",
      "lyrics": "Complete lyrics with metatags...",
      "style": "comma, separated, style, elements..."
    }
  ]
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

IMPORTANT: If the current lyrics include backing vocals in parentheses (e.g., "lyrics here (backing vocals)"), maintain this feature in the new lyrics. Use backing vocals in parentheses where appropriate, especially in chorus sections.

Respond in JSON format with ONLY the new lyrics:
{
  "lyrics": "Complete new lyrics with metatags..."
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
5. Create a fresh, compelling song title

Respond in JSON format:
{
  "style": "updated, comma, separated, style, description...",
  "title": "New compelling song title"
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

export function generateCustomLyricsPrompt(
  customLyrics: string,
  vision: string,
  genre: string,
  mood: string,
  tempo: string
): string {
  return `Enhance the user's custom lyrics for Suno AI Custom Mode by adding instrumentation metatags.

USER'S VISION: ${vision}
GENRE: ${genre}
MOOD: ${mood}
TEMPO: ${tempo}

USER'S CUSTOM LYRICS:
${customLyrics}

YOUR TASK:
1. Keep ALL the lyrics text EXACTLY as the user wrote them - do not change any words
2. Enhance each section tag (like [Verse 1], [Chorus], etc.) by adding instrumentation details
3. The format should be: [Section: instrumentation details]
4. If a tag already has instrumentation (e.g., [Verse 1: some details]), REPLACE the existing instrumentation with new instrumentation that matches the user's vision, genre, and mood
5. Generate a style description that matches the vision, genre, mood, and tempo
6. Create a fitting song title based on the lyrics content

INSTRUMENTATION ENHANCEMENT RULES:
- Match instrumentation to the genre and mood specified
- Verse sections: Usually more stripped back, focus on storytelling
- Chorus sections: Full power, all instruments, often with backing vocals
- Bridge sections: Contrast, often instrumental or solo
- Intro/Outro: Appropriate opening/closing instrumentation
- Include details like: instruments, vocal style, dynamics, effects

EXAMPLES:
- User writes: [Verse 1] → You enhance to: [Verse 1: heavy metal guitar, heavy drums, aggressive male singer]
- User writes: [Verse 1: old instrumentation] → You REPLACE to: [Verse 1: heavy metal guitar, heavy drums, aggressive male singer]
- User writes: [Chorus] → You enhance to: [Chorus: full band, distorted guitars, powerful vocals, backing vocals]
- User writes: [Bridge] → You enhance to: [Bridge: guitar solo, ambient synths, no vocals]

Respond in JSON format:
{
  "songs": [
    {
      "title": "Song title based on lyrics content",
      "lyrics": "Enhanced lyrics with instrumentation metatags (keep original lyrics text intact)...",
      "style": "comma, separated, style, elements matching ${genre}, ${mood}..."
    }
  ]
}`;
}

export function generateArtistModePrompt(
  title: string,
  artistName: string,
  wordDensity: string = 'medium'
): string {
  const densityInstructions = {
    'extreme-sparse': 'Use EXTREMELY sparse lyrics with very few words per line (2-4 words). Focus on powerful, impactful single words or short phrases. Maximum economy of language. Leave lots of space between phrases.',
    'low': 'Use sparse, concise lyrics with minimal words (3-6 words per line). Keep it simple and direct. Short, punchy phrases.',
    'medium': 'Use moderate lyric density with balanced phrasing (5-10 words per line). Natural conversational flow.',
    'high': 'Use dense, detailed lyrics with longer phrases and more words per line (10-15 words per line). Rich descriptions and elaborate phrasing.'
  };

  const densityGuidance = densityInstructions[wordDensity as keyof typeof densityInstructions] || densityInstructions.medium;

  return `Create a music project for Suno AI Custom Mode in the style of "${artistName}" with the song title "${title}".

Your task is to:
1. Analyze the musical style, genre, and characteristics of "${artistName}"
2. Create a song that authentically captures their artistic style
3. Generate lyrics and instrumentation that would fit "${artistName}"'s typical sound

IMPORTANT INSTRUCTIONS:
- Study the typical genre, mood, tempo, and production style of "${artistName}"
- Write lyrics that match their lyrical themes, storytelling style, and vocabulary
- Use instrumentation and production techniques characteristic of "${artistName}"'s music
- Match the vocal style (range, delivery, emotion) typical of this artist
- Create a style description that captures the essence of "${artistName}"'s sound

Word Density: ${wordDensity.toUpperCase()} - ${densityGuidance}

Generate:

1. LYRICS: Complete song lyrics with metatag structure
   - Use [Intro], [Verse 1], [Chorus], [Verse 2], [Bridge], [Outro]
   - Add [Instrumental] or other instructions where appropriate
   - Write lyrics that sound like they could be from "${artistName}"
   - IMPORTANT: Follow the word density guideline strictly for the verses and chorus
   - Use backing vocals in parentheses where appropriate, especially if typical of "${artistName}"'s style
   - Each section should have a metatag describing instrumentation typical of this artist
   - Example format:
     [Intro: acoustic guitar, soft piano]
     [Instrumental]

     [Verse 1: acoustic guitar, gentle vocals]
     Lyrics here...

     [Chorus: full band, backing vocals, harmonies]
     Main lyrics here (backing vocals here)
     Add backing vocals using parentheses (yeah yeah)

2. STYLE: Comma-separated style description for "Style of Music" field
   - Genre and subgenre characteristic of "${artistName}"
   - Specific instruments this artist typically uses
   - Vocal style matching "${artistName}" (gender, voice type, delivery)
   - Technical elements and production style of this artist
   - Tempo and key if relevant to their style
   - Mood and atmosphere typical of "${artistName}"'s music

Respond in JSON format:
{
  "songs": [
    {
      "title": "${title}",
      "lyrics": "Complete lyrics with metatags in the style of ${artistName}...",
      "style": "comma, separated, style, elements, matching, ${artistName}..."
    }
  ]
}`;
}
