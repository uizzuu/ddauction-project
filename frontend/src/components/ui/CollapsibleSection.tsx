import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export default function CollapsibleSection({
    title,
    icon,
    children,
    defaultOpen = true,
    className = "",
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`mb-8 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between group mb-4"
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="text-gray-900">{icon}</span>}
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {title}
                    </h3>
                </div>
                <div className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${isOpen ? "rotate-180" : ""} duration-200`}>
                    <ChevronDown size={20} className="text-gray-500" />
                </div>
            </button>

            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                {children}
            </div>
        </div>
    );
}
