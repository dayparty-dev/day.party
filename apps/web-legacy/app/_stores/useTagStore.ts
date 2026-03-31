import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TagOption {
    key: string;
    label: string;
    color: string;
}

interface State {
    tags: TagOption[];
    customTags: TagOption[];
    // selectedTagKey: string | null;
}
interface Actions {
    getAllTags: () => TagOption[];
    addCustomTag: (tag: TagOption) => void;
    removeTag: (key: string) => void;
    removeCustomTag: (key: string) => void;
    // setTags: (tags: TagOption[]) => void;
    // setSelectedTagKey: (key: string | null) => void;
    resetTags: () => void;
    getTagByKey: (key: string) => TagOption | undefined;
}

export const useTagStore = create<State & Actions>()(
  persist(
    (set, get) => {
          return {
            tags: [
                { key: 'work', label: 'Work', color: '#4F46E5' },
                { key: 'home', label: 'Home', color: '#10B981' },
                { key: 'personal', label: 'Personal', color: '#F59E0B' },
                { key: 'study', label: 'Study', color: '#EC4899' },
            ],
            customTags: [],
            selectedTagKey: null,
        
            addCustomTag: (tag) =>{
                console.log('addCustomTag', tag);
                set((state) => ({
                    customTags: [...state.customTags, tag],
                }))
            },
        
            removeTag: (key) =>
                set((state) => ({
                    tags: state.tags.filter((tag) => tag.key !== key),
                })),
                
            removeCustomTag: (key) =>
                set((state) => ({
                    customTags: state.customTags.filter((tag) => tag.key !== key),
                })),
        
            // setTags: (tags) => set({ tags }),
        
            // setSelectedTagKey: (key) => {
            //     console.log('setSelectedTagKey', key);
            //     set({ selectedTagKey: key })
            // },
        
            resetTags: () => set({ tags: [], customTags: [] }),
        
            getAllTags: () => {
                const { tags, customTags } = get();
                return [...tags, ...customTags];
            },
            
            getTagByKey: (key: string) => {
                const allTags = get().getAllTags();
                return allTags.find(tag => tag.key === key);
              }
          };
},
{
  name: 'tag-store',
}
)
);
