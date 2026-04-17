"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

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
  const [filteredOptions, setFilteredOptions] = useState<DropdownOption[]>(options);
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

  const getContainerClass = () => {
    return `dropdown-container ${darkMode ? "dropdown-container-dark" : ""}`;
  };

  const getButtonClass = () => {
    const baseClass = "flex items-center justify-between gap-2 px-3 py-2 rounded-full border transition-all duration-200";
    const modeClass = darkMode
      ? "bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
      : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50";
    const disabledClass = disabled
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer";
    return `${baseClass} ${modeClass} ${disabledClass} ${fontSize}`;
  };

  const getMenuClass = () => {
    const baseClass = "absolute top-full left-0 mt-1 w-full rounded-2xl shadow-lg z-50 transition-all duration-300 ease-out";
    const modeClass = darkMode
      ? "bg-gray-800 border border-gray-700"
      : "bg-white border border-gray-200";
    const visibilityClass = isOpen
      ? "opacity-100 translate-y-0"
      : "opacity-0 -translate-y-2 pointer-events-none";
    return `${baseClass} ${modeClass} ${visibilityClass}`;
  };

  const getOptionClass = (optionValue: string, index: number) => {
    const baseClass = "w-full text-left px-3 py-2 rounded-full transition-colors duration-150";
    const modeClass = darkMode
      ? "text-gray-200 hover:bg-gray-700/50"
      : "text-gray-900 hover:bg-gray-100";
    const selectedClass = value === optionValue
      ? darkMode
        ? "bg-gray-700/50 font-medium"
        : "bg-blue-50 font-medium"
      : "";
    const highlightedClass = index === highlightedIndex
      ? darkMode
        ? "bg-gray-700/50"
        : "bg-gray-100"
      : "";
    const disabledClass = options[index]?.disabled
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer";
    return `${baseClass} ${modeClass} ${selectedClass} ${highlightedClass} ${disabledClass} ${fontSize}`;
  };

  const getSearchInputClass = () => {
    const baseClass = "w-full px-3 py-2 border rounded-full focus:outline-none focus:ring-2";
    const modeClass = darkMode
      ? "bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
      : "bg-white border-gray-300 text-gray-900 focus:ring-blue-500";
    return `${baseClass} ${modeClass} ${fontSize}`;
  };

  const getClearButtonClass = () => {
    const baseClass = "mt-2 px-3 py-1 rounded-2xl transition-colors duration-150";
    const modeClass = darkMode
      ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";
    return `${baseClass} ${modeClass} ${fontSize}`;
  };

  const getLabelClass = () => {
    const baseClass = "block mb-1 font-medium";
    const modeClass = darkMode
      ? "text-gray-300"
      : "text-gray-700";
    return `${baseClass} ${modeClass} ${fontSize}`;
  };

  return (
    <div className={getContainerClass()}>
      {label && (
        <label className={getLabelClass()}>
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled}
          className={getButtonClass()}
          style={{ minWidth }}
        >
          <span className="truncate flex-1">{getDisplayText()}</span>
          <ChevronDown
            className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            size={16}
          />
        </button>

        <div
          className={getMenuClass()}
          style={{
            maxHeight: isOpen ? maxHeight : "0px",
            minWidth,
          }}
        >
          {/* Search input - fixed at top */}
          <div className="p-2 border-b">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="搜索..."
              className={getSearchInputClass()}
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
              <div className={darkMode ? "text-gray-400" : "text-gray-500"} style={{ padding: '1rem', textAlign: 'center' }}>
                没有找到匹配的选项
              </div>
            )}
          </div>
        </div>
      </div>

      {showClearButton && hasValidSelection() && (
        <button
          onClick={() => onChange("")}
          className={getClearButtonClass()}
          title="清除选择"
        >
          <div className="flex items-center gap-1">
            <X size={14} />
            <span>{clearButtonText}</span>
          </div>
        </button>
      )}
    </div>
  );
};

export default Dropdown;