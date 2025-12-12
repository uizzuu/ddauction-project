
import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../css/datepicker.css";
import { Calendar as CalendarIcon } from "lucide-react";
import { ko } from "date-fns/locale";

// CustomInput Props 정의
interface CustomInputProps {
    value?: string; // react-datepicker가 주입하는 value
    onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void; // react-datepicker가 주입하는 onClick
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void; // react-datepicker가 주입하는 onChange (사용하지 않음, onManualChange 사용)
    placeholder?: string;
    disabled?: boolean;
    noDefaultStyle?: boolean;
    className?: string;
    // 부모로부터 받는 추가 Props
    inputValue: string;
    onManualChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    toggleCalendar: (e: React.MouseEvent) => void;
    setIsFocused: (focused: boolean) => void;
}

// CustomInput을 외부로 분리 (컴포넌트 안정성 확보)
const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
    ({ onClick, inputValue, onManualChange, toggleCalendar, setIsFocused, placeholder, disabled, noDefaultStyle, className, ...props }, ref) => (
        <div className="relative w-full" onClick={onClick}>
            <input
                {...props} // react-datepicker가 주입하는 props (ex: value, onChange, onClick)
                ref={ref}
                type="text"
                value={inputValue} // 부모가 관리하는 inputValue 사용
                onChange={onManualChange} // 부모로부터 받은 수동 입력 핸들러 사용
                onClick={(e) => {
                    e.stopPropagation(); // input 클릭 시 달력 열림 방지
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
                placeholder={placeholder}
                maxLength={10}
                className={`
                    ${!noDefaultStyle ? `
                        w-full px-4 py-3 pr-10 bg-white text-left
                        border border-gray-200 rounded-xl transition-all
                        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        border-solid
                    ` : `w-full pr-10`}
                    ${(!inputValue && !noDefaultStyle) ? "text-gray-400" : ""}
                    ${(inputValue && !noDefaultStyle) ? "text-[#111] font-medium" : ""}
                    ${className}
                `}
            />
            <div
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer p-1"
                onClick={toggleCalendar}
            >
                <CalendarIcon size={18} />
            </div>
        </div>
    )
);

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
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    // selected prop이 변경될 때 inputValue 동기화 (입력 중이 아닐 때만)
    useEffect(() => {
        if (!isFocused) {
            if (selected) {
                const year = selected.getFullYear();
                const month = String(selected.getMonth() + 1).padStart(2, '0');
                const day = String(selected.getDate()).padStart(2, '0');
                setInputValue(`${year}-${month}-${day}`);
            } else {
                setInputValue("");
            }
        }
    }, [selected, isFocused]);

    const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        const numbersOnly = value.replace(/[^\d]/g, '');
        const limitedNumbers = numbersOnly.slice(0, 8);

        let formatted = limitedNumbers;
        if (limitedNumbers.length >= 5) {
            formatted = limitedNumbers.slice(0, 4) + '-' + limitedNumbers.slice(4, 6) + (limitedNumbers.length > 6 ? '-' + limitedNumbers.slice(6, 8) : '');
        } else if (limitedNumbers.length >= 4) {
            formatted = limitedNumbers.slice(0, 4) + '-' + limitedNumbers.slice(4);
        }

        setInputValue(formatted);

        // 완전한 날짜 형식(10글자)이고 유효한 날짜일 때만 부모에게 전달
        if (formatted.length === 10) {
            const [year, month, day] = formatted.split('-').map(Number);
            if (year && month && day) {
                const parsedDate = new Date(year, month - 1, day);
                // 유효성 검사 및 실제 값 비교
                if (!isNaN(parsedDate.getTime()) &&
                    parsedDate.getFullYear() === year &&
                    parsedDate.getMonth() === month - 1 &&
                    parsedDate.getDate() === day) {
                    onChange(parsedDate);
                }
            }
        } else if (formatted === "") {
            onChange(null);
        }
        // 그 외(1~9글자)일 때는 onChange를 호출하지 않아 부모 state가 null이 되는 것을 방지
        // (즉, 부모는 기존 값을 유지하거나, 이 컴포넌트 내부에서만 임시 변경)
    };

    const toggleCalendar = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative w-full custom-datepicker-container">
            <DatePicker
                selected={selected}
                onChange={(date) => {
                    onChange(date);
                    setIsOpen(false); // 날짜 선택 시 닫기
                }}
                open={isOpen}
                onClickOutside={() => setIsOpen(false)}
                showTimeSelect={showTimeSelect}
                minDate={minDate}
                maxDate={maxDate}
                dateFormat={showTimeSelect ? "yyyy.MM.dd HH:mm" : dateFormat}
                placeholderText={placeholder}
                disabled={disabled}
                locale={ko}
                customInput={
                    <CustomInput
                        inputValue={inputValue}
                        onManualChange={handleManualInput}
                        toggleCalendar={toggleCalendar}
                        setIsFocused={setIsFocused}
                        noDefaultStyle={noDefaultStyle}
                        className={className}
                        placeholder={placeholder} // placeholder도 CustomInput으로 전달
                        disabled={disabled} // disabled도 CustomInput으로 전달
                    />
                }
                renderCustomHeader={({
                    date,
                    decreaseMonth,
                    increaseMonth,
                    prevMonthButtonDisabled,
                    nextMonthButtonDisabled,
                }) => (
                    <div className="flex items-center justify-between bg-white">
                        <button
                            onClick={decreaseMonth}
                            disabled={prevMonthButtonDisabled}
                            type="button"
                            className="react-datepicker__navigation react-datepicker__navigation--previous"
                            style={{ position: 'relative', top: 0, left: 0 }}
                        >
                            <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--previous">Before</span>
                        </button>
                        <span className="react-datepicker__current-month">
                            {date.getFullYear()}년 {date.getMonth() + 1}월
                        </span>
                        <button
                            onClick={increaseMonth}
                            disabled={nextMonthButtonDisabled}
                            type="button"
                            className="react-datepicker__navigation react-datepicker__navigation--next"
                            style={{ position: 'relative', top: 0, right: 0 }}
                        >
                            <span className="react-datepicker__navigation-icon react-datepicker__navigation-icon--next">Next</span>
                        </button>
                    </div>
                )}
                // Styling Poppers
                calendarClassName="!font-sans !border-0 !shadow-xl !rounded-2 !bg-white overflow-hidden"
                dayClassName={() => "hover:bg-orange-100 rounded-full"}
                timeClassName={() => "!text-sm"}
                wrapperClassName="w-full"
                popperPlacement="bottom-end"
            />
        </div>
    );
}
