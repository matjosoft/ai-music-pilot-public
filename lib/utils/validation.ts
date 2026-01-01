/**
 * Input validation and sanitization utilities
 *
 * Provides protection against:
 * - XSS attacks
 * - SQL injection (via length limits)
 * - AI prompt injection
 * - Database bloat
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * while preserving most user input
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
}

/**
 * Sanitize user input specifically for LLM prompts
 * Protects against prompt injection attacks while preserving legitimate content
 */
export function sanitizePromptInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize multiple newlines (prevent injection separators)
    .replace(/\n{3,}/g, '\n\n')
    // Remove common prompt injection patterns (case-insensitive)
    .replace(/ignore\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/gi, '[FILTERED]')
    .replace(/forget\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/gi, '[FILTERED]')
    .replace(/new\s+(system\s+)?instructions?:/gi, '[FILTERED]')
    .replace(/system\s+(prompt|instructions?):/gi, '[FILTERED]')
    .replace(/override\s+(instructions?|prompts?|rules?)/gi, '[FILTERED]')
    .replace(/disregard\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/gi, '[FILTERED]')
    // Remove attempts to break out of context
    .replace(/<\|system\|>/gi, '[FILTERED]')
    .replace(/<\|assistant\|>/gi, '[FILTERED]')
    .replace(/\[SYSTEM\]/gi, '[FILTERED]')
    .replace(/\[INST\]/gi, '[FILTERED]')
    .replace(/\[\/INST\]/gi, '[FILTERED]')
}

/**
 * Detect potential prompt injection attempts
 * Returns true if suspicious patterns are found
 */
export function detectPromptInjection(input: string): boolean {
  if (typeof input !== 'string') {
    return false
  }

  const injectionPatterns = [
    // Common instruction override patterns
    /ignore\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/i,
    /forget\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/i,
    /disregard\s+(all\s+)?(previous\s+)?(instructions?|prompts?|rules?)/i,
    /new\s+(system\s+)?instructions?:/i,
    /system\s+(prompt|instructions?):/i,
    /override\s+(instructions?|prompts?|rules?)/i,

    // Role manipulation
    /you\s+are\s+(now\s+)?(a|an)\s+/i,
    /act\s+as\s+(a|an)\s+/i,
    /pretend\s+to\s+be/i,
    /simulate\s+(a|an)\s+/i,

    // System tokens and delimiters
    /<\|system\|>/i,
    /<\|assistant\|>/i,
    /<\|user\|>/i,
    /\[SYSTEM\]/i,
    /\[INST\]/i,
    /\[\/INST\]/i,
    /###\s*System/i,
    /###\s*Instruction/i,

    // Excessive newlines (context breaking)
    /\n{5,}/,

    // Prompt leakage attempts
    /repeat\s+(your\s+)?(instructions?|prompt|system\s+prompt)/i,
    /show\s+(me\s+)?(your\s+)?(instructions?|prompt|system\s+prompt)/i,
    /what\s+(are\s+)?(your\s+)?(instructions?|prompt|system\s+prompt)/i,
  ]

  return injectionPatterns.some(pattern => pattern.test(input))
}

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char)
}

/**
 * Validation rules for song generation inputs
 */
// Regex to check for section tags like [Verse], [Verse 1], [Chorus], or with instrumentation [Verse 1: guitar, drums]
const SECTION_TAG_REGEX = /\[(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Hook|Interlude)(\s*\d*)?(\s*:[^\]]+)?\]/i

export const ValidationRules = {
  songName: {
    minLength: 1,
    maxLength: 255,
    pattern: /^[\p{L}\p{N}\s\-_',.!?()&]+$/u,
  },
  vision: {
    minLength: 1,
    maxLength: 2000,
  },
  genre: {
    minLength: 1,
    maxLength: 100,
  },
  mood: {
    minLength: 1,
    maxLength: 100,
  },
  tempo: {
    minLength: 1,
    maxLength: 50,
  },
  title: {
    minLength: 1,
    maxLength: 255,
  },
  artistName: {
    minLength: 1,
    maxLength: 100,
  },
  customLyrics: {
    minLength: 1,
    maxLength: 5000,
  },
  wordDensity: {
    allowed: ['low', 'medium', 'high'],
  },
  mode: {
    allowed: ['custom', 'artist', 'simple'],
  },
} as const

/**
 * Validate and sanitize song name
 */
export function validateSongName(songName: unknown): {
  isValid: boolean
  value?: string
  error?: string
} {
  if (typeof songName !== 'string') {
    return { isValid: false, error: 'Song name must be a string' }
  }

  const sanitized = sanitizeString(songName)

  if (sanitized.length < ValidationRules.songName.minLength) {
    return { isValid: false, error: 'Song name is required' }
  }

  if (sanitized.length > ValidationRules.songName.maxLength) {
    return {
      isValid: false,
      error: `Song name must be less than ${ValidationRules.songName.maxLength} characters`,
    }
  }

  // Allow most printable characters but prevent HTML/script tags
  if (!ValidationRules.songName.pattern.test(sanitized)) {
    return {
      isValid: false,
      error: 'Song name contains invalid characters',
    }
  }

  return { isValid: true, value: sanitized }
}

/**
 * Validate and sanitize text field
 */
export function validateTextField(
  fieldName: string,
  value: unknown,
  rules: { minLength?: number; maxLength?: number }
): {
  isValid: boolean
  value?: string
  error?: string
} {
  if (typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` }
  }

  const sanitized = sanitizeString(value)

  if (rules.minLength && sanitized.length < rules.minLength) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (rules.maxLength && sanitized.length > rules.maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be less than ${rules.maxLength} characters`,
    }
  }

  return { isValid: true, value: sanitized }
}

/**
 * Validate enum value
 */
export function validateEnum<T extends string>(
  fieldName: string,
  value: unknown,
  allowed: readonly T[]
): {
  isValid: boolean
  value?: T
  error?: string
} {
  if (typeof value !== 'string') {
    return { isValid: false, error: `${fieldName} must be a string` }
  }

  if (!allowed.includes(value as T)) {
    return {
      isValid: false,
      error: `${fieldName} must be one of: ${allowed.join(', ')}`,
    }
  }

  return { isValid: true, value: value as T }
}

/**
 * Validate custom lyrics - must contain at least one section tag
 */
export function validateCustomLyrics(lyrics: string): {
  isValid: boolean
  value?: string
  error?: string
} {
  if (typeof lyrics !== 'string' || !lyrics.trim()) {
    return { isValid: false, error: 'Custom lyrics are required when using custom lyrics mode' }
  }

  const sanitized = lyrics.trim()

  if (sanitized.length > ValidationRules.customLyrics.maxLength) {
    return {
      isValid: false,
      error: `Custom lyrics must be less than ${ValidationRules.customLyrics.maxLength} characters`,
    }
  }

  if (!SECTION_TAG_REGEX.test(sanitized)) {
    return {
      isValid: false,
      error: 'Lyrics must contain tags such as [Verse], [Chorus] etc.',
    }
  }

  return { isValid: true, value: sanitized }
}

/**
 * Validate song generation input
 */
export interface SongGenerationInput {
  songName: string
  mode: 'custom' | 'artist' | 'simple'
  vision?: string
  genre?: string
  mood?: string
  tempo?: string
  wordDensity?: 'low' | 'medium' | 'high'
  title?: string
  artistName?: string
  instrumental?: boolean
  useCustomLyrics?: boolean
  customLyrics?: string
}

export function validateSongGeneration(
  input: any
): {
  isValid: boolean
  data?: SongGenerationInput
  errors?: string[]
} {
  const errors: string[] = []

  // Validate song name
  const songNameValidation = validateSongName(input.songName)
  if (!songNameValidation.isValid) {
    errors.push(songNameValidation.error!)
  }

  // Validate mode
  const modeValidation = validateEnum(
    'mode',
    input.mode,
    ValidationRules.mode.allowed
  )
  if (!modeValidation.isValid) {
    errors.push(modeValidation.error!)
  }

  // Validate word density (optional)
  let wordDensity: 'low' | 'medium' | 'high' = 'medium'
  if (input.wordDensity) {
    const wordDensityValidation = validateEnum(
      'wordDensity',
      input.wordDensity,
      ValidationRules.wordDensity.allowed
    )
    if (!wordDensityValidation.isValid) {
      errors.push(wordDensityValidation.error!)
    } else {
      wordDensity = wordDensityValidation.value!
    }
  }

  // Mode-specific validation
  if (modeValidation.value === 'artist') {
    // Validate title
    const titleValidation = validateTextField(
      'title',
      input.title,
      ValidationRules.title
    )
    if (!titleValidation.isValid) {
      errors.push(titleValidation.error!)
    }

    // Validate artist name
    const artistNameValidation = validateTextField(
      'artistName',
      input.artistName,
      ValidationRules.artistName
    )
    if (!artistNameValidation.isValid) {
      errors.push(artistNameValidation.error!)
    }

    if (errors.length > 0) {
      return { isValid: false, errors }
    }

    return {
      isValid: true,
      data: {
        songName: songNameValidation.value!,
        mode: modeValidation.value!,
        title: titleValidation.value!,
        artistName: artistNameValidation.value!,
        wordDensity,
        instrumental: Boolean(input.instrumental),
      },
    }
  } else {
    // Validate custom mode fields
    const visionValidation = validateTextField(
      'vision',
      input.vision,
      ValidationRules.vision
    )
    if (!visionValidation.isValid) {
      errors.push(visionValidation.error!)
    }

    const genreValidation = validateTextField(
      'genre',
      input.genre,
      ValidationRules.genre
    )
    if (!genreValidation.isValid) {
      errors.push(genreValidation.error!)
    }

    const moodValidation = validateTextField(
      'mood',
      input.mood,
      ValidationRules.mood
    )
    if (!moodValidation.isValid) {
      errors.push(moodValidation.error!)
    }

    const tempoValidation = validateTextField(
      'tempo',
      input.tempo,
      ValidationRules.tempo
    )
    if (!tempoValidation.isValid) {
      errors.push(tempoValidation.error!)
    }

    // Validate custom lyrics if useCustomLyrics is true and not instrumental
    const useCustomLyrics = Boolean(input.useCustomLyrics) && !Boolean(input.instrumental)
    let customLyricsValue: string | undefined

    if (useCustomLyrics) {
      const customLyricsValidation = validateCustomLyrics(input.customLyrics || '')
      if (!customLyricsValidation.isValid) {
        errors.push(customLyricsValidation.error!)
      } else {
        customLyricsValue = customLyricsValidation.value
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors }
    }

    return {
      isValid: true,
      data: {
        songName: songNameValidation.value!,
        mode: modeValidation.value!,
        vision: visionValidation.value!,
        genre: genreValidation.value!,
        mood: moodValidation.value!,
        tempo: tempoValidation.value!,
        wordDensity,
        instrumental: Boolean(input.instrumental),
        useCustomLyrics,
        customLyrics: customLyricsValue,
      },
    }
  }
}
