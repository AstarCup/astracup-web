'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/app/components/ConfigProvider';

export default function Guide() {
    const { tournamentSettings } = useConfig();
    const [contentHtml, setContentHtml] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (tournamentSettings?.current_season) {
            fetchGuideContent();
        }
    }, [tournamentSettings]);

    const fetchGuideContent = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/guide?season=s${tournamentSettings?.current_season}`);

            if (response.ok) {
                const data = await response.json();
                setContentHtml(data.contentHtml);
            } else {
                setError('获取指导书内容失败');
            }
        } catch (error) {
            console.error('Failed to fetch guide content:', error);
            setError('获取指导书内容时出错');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto p-6 text-white bg-[#3D3D3D]">
                <div className="text-center py-20">
                    <div className="text-xl mb-4">正在加载指导书内容...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-5xl mx-auto p-6 text-white bg-[#3D3D3D]">
                <div className="bg-red-500/20 border border-red-500 p-4 mb-6">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 text-white bg-[#3D3D3D]">
            <div
                className="markdown-content"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
        </div>
    );
}