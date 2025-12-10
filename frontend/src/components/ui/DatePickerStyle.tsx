import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../css/datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";

interface DatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
    showTimeSelect?: boolean;
    dateFormat?: string;
    disabled?: boolean;
    className?: string;
    noDefaultStyle?: boolean;
}

export default function DatePickerStyle({
    selected,
    onChange,
    placeholder = "날짜 선택",
    minDate,
    maxDate,
    showTimeSelect = false,
    dateFormat = "yyyy.MM.dd",
    disabled = false,
    className = "",
    noDefaultStyle = false
}: DatePickerProps) {

    // Custom Input Component
    const CustomInput = React.forwardRef<HTMLButtonElement, any>(
        ({ value, onClick }, ref) => (
            <button
                type="button"
                onClick={onClick}
                ref={ref}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between
                    ${!noDefaultStyle ? `
                        px-4 py-3 bg-white text-left
                        border border-gray-200 rounded-xl transition-all
                        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                    ` : ""}
                    ${(!value && !noDefaultStyle) ? "text-gray-400" : ""}
                    ${(value && !noDefaultStyle) ? "text-[#111] font-medium" : ""}
                    ${className}
                `}
            >
                <span>{value || placeholder}</span>
                <CalendarIcon size={18} className="text-gray-400" />
            </button>
        )
    );

    return (
        <div className="relative w-full custom-datepicker-container">
            <DatePicker
                selected={selected}
                onChange={onChange}
                showTimeSelect={showTimeSelect}
                minDate={minDate}
                maxDate={maxDate}
                dateFormat={showTimeSelect ? "yyyy.MM.dd HH:mm" : dateFormat}
                placeholderText={placeholder}
                disabled={disabled}
                customInput={<CustomInput />}
                // Styling Poppers
                calendarClassName="!font-sans !border-0 !shadow-xl !rounded-2xl !p-3 !bg-white overflow-hidden"
                dayClassName={() =>
                    "hover:bg-orange-100 rounded-full"
                }
                timeClassName={() => "!text-sm"}
                wrapperClassName="w-full"
                popperPlacement="bottom-start"
            />
        </div>
    );
}
