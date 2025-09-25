"use client";
import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface ContextMenuItem {
    label: string;
    onClick?: () => void;
    icon?: string;
    type?: 'item' | 'separator';
}

interface ContextMenuProps {
    items: ContextMenuItem[];
    position: { x: number; y: number };
    onClose: () => void;
}

export default function ContextMenu({ items, position, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-48"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            {items.map((item, index) => (
                item.type === 'separator' ? (
                    <div key={index} className="border-t border-gray-200 my-1"></div>
                ) : (
                    <button
                        key={index}
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2 text-sm"
                    >
                        <Image src={item.icon || ''} alt="" width={24} height={24} />
                        <span>{item.label}</span>
                    </button>
                )
            ))}
        </div>
    );
}