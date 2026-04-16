"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";

// 图标缓存，避免重复创建Image组件
const iconCache = new Map<string, React.ReactElement>();

interface ContextMenuItem {
  label: string;
  onClick?: () => void;
  icon?: string;
  type?: "item" | "separator";
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
}

// 获取缓存的图标组件
const getCachedIcon = (iconSrc: string) => {
  if (!iconSrc) return null;

  if (!iconCache.has(iconSrc)) {
    iconCache.set(
      iconSrc,
      <Image src={iconSrc} alt="" width={24} height={24} />,
    );
  }

  return iconCache.get(iconSrc);
};

export default function ContextMenu({
  items,
  position,
  onClose,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-300  shadow-lg py-1 min-w-48"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {items.map((item, index) =>
        item.type === "separator" ? (
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
            {getCachedIcon(item.icon || "")}
            <span>{item.label}</span>
          </button>
        ),
      )}
    </div>
  );
}
