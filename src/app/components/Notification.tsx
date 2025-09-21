'use client';
import Image from 'next/image';
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
                return '/icons/success.svg';
            case 'error':
                return '/icons/error.svg';
            case 'warning':
                return '/icons/warning.svg';
            case 'info':
            default:
                return '/icons/info.svg';
        }
    };

    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-white text-green-600 border-green-200';
            case 'error':
                return 'bg-white text-red-600 border-red-200';
            case 'warning':
                return 'bg-white text-yellow-600 border-yellow-200';
            case 'info':
            default:
                return 'bg-white text-gray-600 border-blue-200';
        }
    };

    return (
        <div
            className={`
                ${getStyles()}
                flex flex-col items-center gap-2 px-6 py-4 border shadow-lg
                animate-in slide-in-from-bottom-full duration-300
                min-w-[200px] max-w-[300px]
            `}
        >
            <span className="text-2xl font-bold">
                <Image src={getIcon()} alt={type} width={36} height={36} />
            </span>
            <span className="text-sm font-medium text-center leading-tight">
                {message}
            </span>
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
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-3 pointer-events-none"
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