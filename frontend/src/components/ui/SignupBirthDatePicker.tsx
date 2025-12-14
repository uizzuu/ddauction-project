import { forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import { getYear, getMonth, setYear } from "date-fns";
// 💡 달력 아이콘 import (lucide-react를 사용한다고 가정)
import { Calendar as CalendarIcon } from "lucide-react"; 

// 한국어 locale 등록
registerLocale("ko", ko);

// 현재 날짜를 기준으로 최소 나이(minAge)에 해당하는 생년월일의 최대값(MaxDate)을 계산하는 함수
const calculateMaxDate = (minAge: number): Date => {
  const today = new Date();
  return setYear(today, getYear(today) - minAge);
};

interface SignupBirthDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  minAge: number; // 최소 나이 (예: 19세 이상)
}

// 💡 forwardRef를 사용하여 ref를 외부(Signup.tsx)로부터 받습니다.
const SignupBirthDatePicker = forwardRef<DatePicker, SignupBirthDatePickerProps>(
  ({ value, onChange, minAge }, ref) => {
    // 최소 나이 제한에 따른 선택 가능한 최대 날짜
    const maxDate = calculateMaxDate(minAge);

    // 💡 아이콘 클릭 시 DatePicker를 여는 함수
    const handleIconClick = () => {
      // ref가 존재하고, 함수가 아니며, current 속성이 있는지 확인
      if (ref && typeof ref !== 'function' && ref.current) {
        // DatePicker의 setFocus() 메서드를 호출하여 달력을 엽니다
        ref.current.setFocus();
      }
    };

    // 현재 년도에서 -100년까지의 년도 목록 생성
    const years = Array.from(
      { length: 100 },
      (_, i) => getYear(new Date()) - i
    );

    // 1월부터 12월까지의 월 목록
    const months = Array.from({ length: 12 }, (_, i) => i);

    return (
      // 💡 relative 포지셔닝을 사용하여 아이콘을 겹치게 할 준비
      <div className="relative w-full"> 
        <DatePicker
          ref={ref}
          selected={value}
          onChange={onChange}
          locale="ko"
          dateFormat="yyyy년 MM월 dd일"
          placeholderText="생일"
          maxDate={maxDate}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          renderCustomHeader={({
            date,
            changeYear,
            changeMonth,
            decreaseMonth,
            increaseMonth,
            prevMonthButtonDisabled,
            nextMonthButtonDisabled,
          }) => (
            <div className="flex items-center justify-between p-2">
              <button
                onClick={decreaseMonth}
                disabled={prevMonthButtonDisabled}
                className="p-1 disabled:opacity-30"
                aria-label="Previous Month"
              >
                {"<"}
              </button>
              <div className="flex space-x-2">
                <select
                  value={getYear(date)}
                  onChange={({ target: { value } }) => changeYear(parseInt(value))}
                  className="p-1 border border-gray-300 rounded"
                  aria-label="Select Year"
                >
                  {years.map((option) => (
                    <option key={option} value={option}>
                      {option}년
                    </option>
                  ))}
                </select>

                <select
                  value={getMonth(date)}
                  onChange={({ target: { value } }) => changeMonth(parseInt(value))}
                  className="p-1 border border-gray-300 rounded"
                  aria-label="Select Month"
                >
                  {months.map((option) => (
                    <option key={option} value={option}>
                      {option + 1}월
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={increaseMonth}
                disabled={nextMonthButtonDisabled}
                className="p-1 disabled:opacity-30"
                aria-label="Next Month"
              >
                {">"}
              </button>
            </div>
          )}
          // 💡 스타일 수정: 오른쪽 패딩(pr-12)을 늘려서 아이콘이 텍스트와 겹치지 않게 합니다.
          className="w-full px-4 py-3 pr-44 border border-gray-300 focus:outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111] transition-colors rounded-[4px] bg-white text-gray-800 placeholder-gray-400"
        />
        
        {/* 💡 달력 아이콘을 absolute로 배치하고 클릭 가능하게 만듦 */}
        <div 
          className="absolute right-16 top-0 h-full w-10 flex items-center justify-center text-gray-400 cursor-pointer"
          onClick={handleIconClick}
          aria-label="달력 열기"
        >
          <CalendarIcon size={20} />
        </div>
      </div>
    );
  }
);

SignupBirthDatePicker.displayName = "SignupBirthDatePicker";

export default SignupBirthDatePicker;