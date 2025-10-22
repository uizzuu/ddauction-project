import { useState, useRef, useEffect } from "react";
import type { SelectBoxProps } from "../types/types";

export default function SelectBox({
  value,
  onChange,
  options,
  placeholder = "선택하세요",
}: SelectBoxProps) {
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string>(placeholder);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const current = options.find((opt) => opt.value === value);
    setSelectedLabel(current ? current.label : placeholder);
  }, [value, options, placeholder]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="custom-select-box">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`custom-select-button ${open ? "open" : ""}`}
      >
        <span className={`custom-select-label ${open ? "selected" : ""}`}>
          {selectedLabel}
        </span>
        <span className={`custom-select-arrow ${open ? "open" : ""}`}></span>
      </button>

      {open && (
        <ul className="custom-select-options">
          <li
            className="custom-select-option placeholder"
            onClick={() => handleSelect("")}
          >
            {placeholder}
          </li>
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`custom-select-option ${
                opt.value === value ? "selected" : ""
              }`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}