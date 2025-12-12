import React from "react";
import { Check } from "lucide-react";

interface CheckboxProps {
    id?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    disabled?: boolean;
    className?: string; // Container class
}

export default function CheckboxStyle({ id, checked, onChange, label, disabled, className = "" }: CheckboxProps) {
    return (
        <div className={`flex items-center ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
            <label className="relative flex items-center cursor-pointer select-none group">
                <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                    className="peer sr-only"
                />

                {/* Custom Checkbox Box */}
                <div className={`
                    w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-200
                    ${checked
                        ? "bg-black border-black text-white"
                        : "bg-white border-gray-300 text-transparent hover:border-black"
                    }
                    ${disabled ? "bg-gray-100 border-gray-200 !text-transparent" : ""}
                `}>
                    <Check size={14} strokeWidth={3} />
                </div>

                {/* Label */}
                {label && (
                    <span className={`ml-2 text-sm font-medium transition-colors ${checked ? "text-black" : "text-gray-600"} group-hover:text-black`}>
                        {label}
                    </span>
                )}
            </label>
        </div>
    );
}
