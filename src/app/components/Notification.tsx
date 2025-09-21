'use client';

import { useState, useEffect } from 'react';

export interface NotificationProps {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
}

interface NotificationItemProps extends NotificationProps {
    onRemove: (id: string) => void;
}

const NotificationItem = ({ id, type, message, duration = 2000, onRemove }: NotificationItemProps) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onRemove]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white border-green-600';
            case 'error':
                return 'bg-red-500 text-white border-red-600';
            case 'warning':
                return 'bg-yellow-500 text-black border-yellow-600';
            case 'info':
            default:
                return 'bg-blue-500 text-white border-blue-600';
        }
    };

    return (
        <div
            className={`
                ${getStyles()}
                flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg
                animate-in slide-in-from-right-full duration-300
                min-w-[300px] max-w-[500px]
            `}
        >
            <span className="text-lg font-bold flex-shrink-0">
                {getIcon()}
            </span>
            <span className="text-sm font-medium flex-1">
                {message}
            </span>
            <button
                onClick={() => onRemove(id)}
                className="text-current opacity-70 hover:opacity-100 ml-2 flex-shrink-0"
                aria-label="关闭通知"
            >
                ✕
            </button>
        </div>
    );
};

export const NotificationContainer = () => {
    const [notifications, setNotifications] = useState<NotificationProps[]>([]);

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    };

    // 全局通知管理器
    useEffect(() => {
        const handleAddNotification = (event: CustomEvent<NotificationProps>) => {
            setNotifications(prev => [...prev, event.detail]);
        };

        window.addEventListener('add-notification', handleAddNotification as EventListener);

        return () => {
            window.removeEventListener('add-notification', handleAddNotification as EventListener);
        };
    }, []);

    if (notifications.length === 0) {
        return null;
    }

    return (
        <div
            className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
            style={{ zIndex: 9999 }}
        >
            {notifications.map((notification) => (
                <div key={notification.id} className="pointer-events-auto">
                    <NotificationItem
                        {...notification}
                        onRemove={removeNotification}
                    />
                </div>
            ))}
        </div>
    );
};

// 全局通知函数
export const showNotification = (
    type: NotificationProps['type'],
    message: string,
    duration: number = 2000
) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: NotificationProps = {
        id,
        type,
        message,
        duration
    };

    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('add-notification', { detail: notification }));
};

// 便捷函数
export const showSuccess = (message: string, duration?: number) => 
    showNotification('success', message, duration);

export const showError = (message: string, duration?: number) => 
    showNotification('error', message, duration);

export const showInfo = (message: string, duration?: number) => 
    showNotification('info', message, duration);

export const showWarning = (message: string, duration?: number) => 
    showNotification('warning', message, duration);