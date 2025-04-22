import { useTagStore } from 'app/_stores/useTagStore';

export const useTags = () => {
  const tags = useTagStore(state => state.tags);

  // Obtener tareas globales
  const customTags = useTagStore(state => state.customTags);

  // Obtener tareas para el día seleccionado
  const selectedTagKey = useTagStore(state => state.selectedTagKey);

  // Obtener la capacidad del día
  const getAllTags = useTagStore(state => state.getAllTags);

  // Obtener la fecha actual
  const addCustomTag = useTagStore(state => state.addCustomTag);

  // Obtener el total de minutos de las tareas
  const removeCustomTag = useTagStore(state => state.removeCustomTag);

  // Inicialización del store
  const setSelectedTagKey = useTagStore(state => state.setSelectedTagKey);

  // Actualizar fecha actual
  const resetTags = useTagStore(state => state.resetTags);

  // Cambiar capacidad del día
  const getTagByKey = useTagStore(state => state.getTagByKey);

  return {
    tags,
    customTags,
    selectedTagKey,
    getAllTags,
    addCustomTag,
    removeCustomTag,
    setSelectedTagKey,
    resetTags,
    getTagByKey
  };
};
