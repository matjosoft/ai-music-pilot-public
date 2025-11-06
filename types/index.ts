export type GenerationMode = 'simple' | 'custom';

export interface ProjectFormData {
  projectName: string;
  mode: GenerationMode;
  simpleDescription?: string;
  artistReference?: string;
  genre?: string;
  mood?: string;
  theme?: string;
  targetAudience?: string;
  additionalNotes?: string;
}

export interface SongStructure {
  lyrics: string;
  style: string;
  title: string;
}

export interface GenerationResponse {
  projectName: string;
  mode: GenerationMode;
  songs: SongStructure[];
  timestamp: string;
}

export interface StoredProject extends GenerationResponse {
  id: string;
}
