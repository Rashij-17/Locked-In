// ==========================================
// 🔒 Locked In — Tag Store (Zustand)
// ==========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tag } from '../types';
import { PRESET_TAG_COLORS } from '../types';

interface TagState {
  tags: Tag[];
  addTag: (name: string, color: string) => Tag;
  updateTag: (id: string, updates: Partial<Omit<Tag, 'id'>>) => void;
  deleteTag: (id: string) => void;
  getTag: (id: string) => Tag | undefined;
}

// Default tags to start with
const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-design', name: 'Design', color: PRESET_TAG_COLORS[9] },
  { id: 'tag-dev', name: 'Dev', color: PRESET_TAG_COLORS[6] },
  { id: 'tag-study', name: 'Study', color: PRESET_TAG_COLORS[4] },
  { id: 'tag-personal', name: 'Personal', color: PRESET_TAG_COLORS[12] },
  { id: 'tag-work', name: 'Work', color: PRESET_TAG_COLORS[2] },
];

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: DEFAULT_TAGS,
      
      addTag: (name, color) => {
        const newTag: Tag = {
          id: `tag-${crypto.randomUUID()}`,
          name,
          color,
        };
        set((s) => ({ tags: [...s.tags, newTag] }));
        return newTag;
      },

      updateTag: (id, updates) =>
        set((s) => ({
          tags: s.tags.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTag: (id) =>
        set((s) => ({ tags: s.tags.filter((t) => t.id !== id) })),

      getTag: (id) => get().tags.find((t) => t.id === id),
    }),
    {
      name: 'lockedin-tags',
    }
  )
);
