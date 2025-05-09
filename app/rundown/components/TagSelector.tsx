import { useAppTranslation } from 'app/_hooks/useAppTranslation';
import { useTags } from 'app/_hooks/useTags';
import { useEffect, useRef, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

interface TagSelectorProps {
    selectedKey?: string | null;
    onSelect?: (key: string) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedKey, onSelect }) => {
    const { t } = useAppTranslation();
    const {
        tags,
        customTags,
        addCustomTag,
        removeTag,
        removeCustomTag,
    } = useTags();

    const [customLabel, setCustomLabel] = useState('');
    const [customColor, setCustomColor] = useState('#888888');
    const [selectedTagKey, setSelectedTagKey] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Si recibimos selectedKey desde fuera
    useEffect(() => {
        if (selectedKey) {
            setSelectedTagKey(selectedKey);
        }
    }, [selectedKey, setSelectedTagKey]);

    // Focus automático cuando seleccionamos "custom"
    useEffect(() => {
        if (selectedTagKey === 'custom') {
            inputRef.current?.focus();
        }
    }, [selectedTagKey]);

    const handleAddCustomTag = () => {
        const trimmedLabel = customLabel.trim();
        if (!trimmedLabel) return;

        const normalizedKey = trimmedLabel.replace(/\s+/g, '_');

        // Verificar si ya existe un tag con ese key o label (solo entre customTags)
        const existing = customTags.find(
            (tag) =>
                tag.key === normalizedKey ||
                tag.label === trimmedLabel
        );

        if (existing) {
            setSelectedTagKey(existing.key);
        } else {
            addCustomTag({
                key: normalizedKey,
                label: trimmedLabel,
                color: customColor,
            });
            setSelectedTagKey(normalizedKey);
        }

        setCustomLabel('');
        setCustomColor('#888888');
    };

    // const isDefaultTag = (key: string) => tags.some((tag) => tag.key === key);

    const handleClickTag = (key: string) => {
        setSelectedTagKey(key);
        if (onSelect)
            onSelect(key);
    };

    return (
        <div className="flex flex-col w-full gap-2" >
            <div className="flex gap-2 overflow-x-auto">
                {tags.map((tag) => (
                    <button
                        key={tag.key}
                        type="button"
                        onClick={() => handleClickTag(tag.key)}
                        className={`flex flex-row badge badge-lg cursor-pointer transition-all border-2 ${selectedTagKey === tag.key ? 'border-black' : 'border-transparent'}`}
                        style={{ backgroundColor: tag.color, color: 'white' }}
                    >
                        {t(`tags.${tag.key}`)}
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag.key);
                            }}
                            className="bg-white text-black rounded-full p-1 text-xs shadow hover:bg-gray-100 transition-colors cursor-pointer"
                            title={t('delete')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && removeCustomTag(tag.key)}
                        >
                            <FaTimes size={10} />
                        </span>
                    </button>
                ))}

                {customTags.map((tag) => (
                    <div
                        key={tag.key}
                        className={`badge badge-lg cursor-pointer transition-all border-2 text-nowrap relative group ${selectedTagKey === tag.key ? 'border-black' : 'border-transparent'}`}
                        style={{ backgroundColor: tag.color, color: 'white' }}
                        onClick={() => handleClickTag(tag.key)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTagKey(tag.key)}
                    >
                        {tag.label}

                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                removeCustomTag(tag.key);
                            }}
                            className="bg-white text-black rounded-full p-1 text-xs shadow hover:bg-gray-100 transition-colors cursor-pointer"
                            title={t('delete')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && removeCustomTag(tag.key)}
                        >
                            <FaTimes size={10} />
                        </span>
                    </div>
                ))}

                <button
                    key="custom"
                    type="button"
                    onClick={() => setSelectedTagKey('custom')}
                    className={`badge badge-lg cursor-pointer transition-all border-2 ${selectedTagKey === 'custom' ? 'border-black' : 'border-transparent'}`}
                    style={{ backgroundColor: '#AAAAAA', color: 'white' }}
                >
                    {t('tags.custom')}
                </button>
            </div>

            {
                selectedTagKey === 'custom' && (
                    <div className="flex items-center gap-2 mt-2">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={t('tags.add_placeholder')}
                            className="input input-bordered"
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                        />
                        <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="w-10 h-10 rounded-full border-2 border-gray-300 cursor-pointer"
                        />
                        <button onClick={handleAddCustomTag} className="btn btn-primary">
                            {t('tags.add')}
                        </button>
                    </div>
                )
            }
        </div >
    );
};

export default TagSelector;
