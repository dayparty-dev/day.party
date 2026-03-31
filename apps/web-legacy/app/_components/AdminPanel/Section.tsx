import { useState } from "react";

interface SectionProps {
    id: string;
    isVisible?: boolean;
    title?: string;
    isExpanded?: boolean;
    children?: React.ReactNode;
    isSelected?: boolean;
}

export default function Section({ id, isVisible, title, isExpanded = false, children, isSelected }: SectionProps) {
    // const [render, setRender] = useState(isVisible);
    if (!isVisible) return "";

    return (
        <section id={id} className={`collapse collapse-arrow border border-base-300 ${isSelected ? 'active border-info bg-base-200' : ''}`}>
            <input type="checkbox" defaultChecked={isExpanded} />
            <div className="collapse-title font-medium">
                {title}
            </div>
            <div className="collapse-content">
                {children}
            </div>
        </section>
    )
}