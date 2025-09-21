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
    className?: string;
    buttonClassName?: string;
    dropdownClassName?: string;
    optionClassName?: string;
    selectedOptionClassName?: string;
    disabled?: boolean;
    maxHeight?: string;
    minWidth?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = "请选择",
    label,
    showClearButton = false,
    clearButtonText = "清除",
    className = "",
    buttonClassName = "",
    dropdownClassName = "",
    optionClassName = "",
    selectedOptionClassName = "",
    disabled = false,
    maxHeight = "12rem", // max-h-48
    minWidth = "7.5rem", // min-w-[120px]
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

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {label && (
                <label className="text-gray-800 text-sm font-medium">
                    {label}
                </label>
            )}

            <div ref={dropdownRef} className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`
                        bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded text-sm 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer 
                        flex items-center justify-between hover:bg-gray-50 transition-colors duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        ${minWidth}
                        ${buttonClassName}
                    `}
                    style={{ minWidth }}
                >
                    <span className="truncate">
                        {getDisplayText()}
                    </span>
                    <svg
                        className={`w-3 h-3 ml-2 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                            }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div
                        className={`
                            absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 
                            rounded shadow-lg z-50 overflow-y-auto
                            ${dropdownClassName}
                        `}
                        style={{ maxHeight }}
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => !option.disabled && handleOptionClick(option.value)}
                                disabled={option.disabled}
                                className={`
                                    w-full px-3 py-2 text-left text-sm transition-colors duration-200
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    ${option.disabled
                                        ? 'text-gray-400'
                                        : 'hover:bg-gray-100 text-gray-800'
                                    }
                                    ${value === option.value
                                        ? `bg-blue-100 text-blue-700 ${selectedOptionClassName}`
                                        : optionClassName
                                    }
                                `}
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
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                    title={`清除选择`}
                >
                    {clearButtonText}
                </button>
            )}
        </div>
    );
};

export default Dropdown;