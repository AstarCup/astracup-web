"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export interface DropdownOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  showClearButton?: boolean;
  clearButtonText?: string;
  disabled?: boolean;
  maxHeight?: string;
  minWidth?: string;
  darkMode?: boolean;
  fontSize?:
    | "text-xs"
    | "text-sm"
    | "text-base"
    | "text-lg"
    | "text-xl"
    | "text-4xl";
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "请选择",
  label,
  showClearButton = false,
  clearButtonText = "清除",
  disabled = false,
  maxHeight = "12rem",
  minWidth = "20rem",
  darkMode = false,
  fontSize = "text-sm",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOptions, setFilteredOptions] =
    useState<DropdownOption[]>(options);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredOptions(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchQuery, options]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1,
          );
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleOptionClick(filteredOptions[highlightedIndex].value);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscKey);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscKey);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, filteredOptions, highlightedIndex]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchQuery("");
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const getSelectedOption = () => {
    return options.find((option) => option.value === value);
  };

  const getDisplayText = () => {
    const selectedOption = getSelectedOption();
    if (selectedOption) {
      return selectedOption.count !== undefined
        ? `${selectedOption.label} (${selectedOption.count})`
        : selectedOption.label;
    }
    return placeholder;
  };

  const hasValidSelection = () => {
    return value && getSelectedOption();
  };

  const getButtonClass = () => {
    const baseClass = darkMode
      ? "dropdown-button dropdown-button-dark"
      : "dropdown-button";
    return `${baseClass} ${fontSize}`;
  };

  const getOptionClass = (optionValue: string, index: number) => {
    const baseClass = darkMode
      ? "dropdown-option dropdown-option-dark"
      : "dropdown-option";

    const selectedClass =
      value === optionValue
        ? darkMode
          ? "dropdown-option-selected-dark"
          : "dropdown-option-selected"
        : "";

    const highlightedClass =
      index === highlightedIndex
        ? darkMode
          ? "dropdown-option-highlighted-dark"
          : "dropdown-option-highlighted"
        : "";

    return `${baseClass} ${fontSize} ${selectedClass} ${highlightedClass}`;
  };

  return (
    <div className="dropdown-container">
      {label && (
        <label
          className={`dropdown-label ${darkMode ? "dropdown-label-dark" : ""}`}
        >
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={getButtonClass()}
          style={{ minWidth }}
        >
          <span className="truncate flex-1 text-left">{getDisplayText()}</span>
          <ChevronDown
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        <div
          className={`dropdown-menu transition-all duration-300 ease-out ${isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}
          style={{
            maxHeight: isOpen ? maxHeight : "0px",
            minWidth,
          }}
        >
          {/* Search input - fixed at top */}
          <div className="p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="搜索..."
              className={`text-black w-full px-2 py-1 border border-gray-300 ${fontSize}`}
            />
          </div>

          {/* Filtered options - scrollable area */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `calc(${maxHeight} - 3.5rem)` }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    !option.disabled && handleOptionClick(option.value)
                  }
                  disabled={option.disabled}
                  className={getOptionClass(option.value, index)}
                >
                  {option.count !== undefined
                    ? `${option.label} (${option.count})`
                    : option.label}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                没有找到匹配的选项
              </div>
            )}
          </div>
        </div>
      </div>

      {showClearButton && hasValidSelection() && (
        <button
          onClick={() => onChange("")}
          className="dropdown-clear-button"
          title={`清除选择`}
        >
          {clearButtonText}
        </button>
      )}
    </div>
  );
};

export default Dropdown;
