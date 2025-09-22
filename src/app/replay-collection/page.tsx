"use client";

import { useState, useEffect } from 'react';
import { hasReplayAccess } from './edgeconfig';
import MapoolTable from '../components/MapoolTable';
import { showError, showSuccess } from '../components/Notification';

// 假设有全局 user 信息
// import { useUser } from '../hooks/useUser';

export default function ReplayCollectionPage({ user }: { user: { id: string; username: string } }) {
    const [paddingMaps, setPaddingMaps] = useState<any[]>([]);
    const [selectedSeason, setSelectedSeason] = useState('s1');
    const [selectedCategory, setSelectedCategory] = useState('qualification');
    const [uploading, setUploading] = useState(false);
    const [uploadedUsers, setUploadedUsers] = useState<{ [key: string]: string[] }>({}); // { mapId: [userId, ...] }

    useEffect(() => {
        const checkAccessAndLoadData = async () => {
            // 权限校验
            if (!user || !(await hasReplayAccess(user.id))) {
                showError('无权限访问回放收集系统');
                return;
            }
            // 获取padding状态的图池
            fetch(`/api/map-selections?season=${selectedSeason}&category=${selectedCategory}&padding=true&osuId=${user.id}`)
                .then(res => res.json())
                .then(data => setPaddingMaps(data.selections || []));
        };
        checkAccessAndLoadData();
    }, [user, selectedSeason, selectedCategory]);

    // 上传回放文件
    const handleReplayUpload = async (map: any, file: File) => {
        if (!file.name.endsWith('.osr')) {
            showError('请上传.osr格式的回放文件');
            return;
        }
        setUploading(true);
        try {
            // 构造文件名
            const filename = `${selectedSeason}/${selectedCategory}/${map.selectedMods}${map.modPosition}_${user.id}.osr`;
            // 上传到vercel blob
            const formData = new FormData();
            formData.append('file', file);
            formData.append('filename', filename);
            formData.append('mapId', map.id);
            formData.append('userId', user.id);
            const res = await fetch('/api/upload-replay', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                showSuccess('上传成功');
                // 刷新已上传用户
                setUploadedUsers(prev => ({
                    ...prev,
                    [map.id]: [...(prev[map.id] || []), user.id]
                }));
            } else {
                showError('上传失败');
            }
        } catch {
            showError('上传失败');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">回放文件收集系统</h2>
            <div className="mb-4 flex gap-4">
                <select value={selectedSeason} onChange={e => setSelectedSeason(e.target.value)} className="border rounded px-2 py-1">
                    <option value="s1">第一赛季</option>
                    {/* 可扩展更多赛季 */}
                </select>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded px-2 py-1">
                    <option value="qualification">资格赛</option>
                    <option value="ro32">32强赛</option>
                    {/* 可扩展更多类型 */}
                </select>
            </div>
            <MapoolTable data={paddingMaps} title="Padding状态图池" />
            <div className="mt-6 space-y-6">
                {paddingMaps.map(map => (
                    <div key={map.id} className="border rounded p-4 mb-2 bg-gray-50">
                        <div className="font-bold mb-2">{map.title} [{map.version}]</div>
                        <div className="mb-2">Mod: {map.selectedMods}{map.modPosition}</div>
                        <div className="mb-2">上传回放文件（.osr）：
                            <input type="file" accept=".osr" disabled={uploading} onChange={e => {
                                if (e.target.files && e.target.files[0]) {
                                    handleReplayUpload(map, e.target.files[0]);
                                }
                            }} />
                        </div>
                        <div className="mb-2">已上传用户：
                            {(uploadedUsers[map.id] || []).length === 0 ? '暂无' : uploadedUsers[map.id].join(', ')}
                            {uploadedUsers[map.id]?.includes(user.id) && <span className="ml-2 text-green-600">(你已上传)</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
