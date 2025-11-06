import { StoredProject } from '@/types';

const STORAGE_KEY = 'suno-projects';

export function getProjects(): StoredProject[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

export function saveProject(project: StoredProject): void {
  if (typeof window === 'undefined') return;

  try {
    const projects = getProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);

    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

export function getProject(id: string): StoredProject | null {
  const projects = getProjects();
  return projects.find(p => p.id === id) || null;
}

export function deleteProject(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const projects = getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting from localStorage:', error);
  }
}
