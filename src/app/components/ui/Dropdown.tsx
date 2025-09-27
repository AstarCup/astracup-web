'use client';

import React, { useState, useRef, useEffect } from 'react';

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
    minWidth = "7.5rem",
    darkMode = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscKey);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleEscKey);
            };
        }
    }, [isOpen]);

    const handleOptionClick = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const getSelectedOption = () => {
        return options.find(option => option.value === value);
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
        return darkMode
            ? 'dropdown-button dropdown-button-dark'
            : 'dropdown-button';
    };

    const getOptionClass = (optionValue: string) => {
        const baseClass = darkMode
            ? 'dropdown-option dropdown-option-dark'
            : 'dropdown-option';

        if (value === optionValue) {
            return darkMode
                ? `${baseClass} dropdown-option-selected-dark`
                : `${baseClass} dropdown-option-selected`;
        }
        return baseClass;
    };

    return (
        <div className="dropdown-container">
            {label && (
                <label className={`dropdown-label ${darkMode ? 'dropdown-label-dark' : ''}`}>
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
                    <span className="truncate flex-1 text-left">
                        {getDisplayText()}
                    </span>
                    <svg
                        className={`w-3 h-3 ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div
                        className="dropdown-menu"
                        style={{ maxHeight }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => !option.disabled && handleOptionClick(option.value)}
                                disabled={option.disabled}
                                className={getOptionClass(option.value)}
                            >
                                {option.count !== undefined
                                    ? `${option.label} (${option.count})`
                                    : option.label
                                }
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {showClearButton && hasValidSelection() && (
                <button
                    onClick={() => onChange('')}
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