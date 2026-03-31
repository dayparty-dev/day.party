import { useTagStore } from 'app/_stores/useTagStore';

export const useTags = () => {
  const tags = useTagStore(state => state.tags);

  const customTags = useTagStore(state => state.customTags);

  const getAllTags = useTagStore(state => state.getAllTags);

  const addCustomTag = useTagStore(state => state.addCustomTag);
  
  const removeTag = useTagStore(state => state.removeTag);

  const removeCustomTag = useTagStore(state => state.removeCustomTag);

  const resetTags = useTagStore(state => state.resetTags);

  const getTagByKey = useTagStore(state => state.getTagByKey);

  return {
    tags,
    customTags,
    getAllTags,
    addCustomTag,
    removeTag,
    removeCustomTag,
    resetTags,
    getTagByKey
  };
};
