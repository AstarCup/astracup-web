"use client";

import { BanPickState, MapPoolSettings } from "../types/banpick";
import Dropdown from "@/app/components/ui/Dropdown";

interface BanPickControlsProps {
    banPickState: BanPickState;
    mapPoolSettings: MapPoolSettings;
    onTeamChange: (team: 'red' | 'blue') => void;
    onActionChange: (action: 'ban' | 'pick') => void;
    onSeasonChange: (season: string) => void;
    onCategoryChange: (category: string) => void;
    onReset: () => void;
}

const CATEGORY_OPTIONS = [
    { value: 'ro16', label: 'RO16' },
    { value: 'quarterfinals', label: 'QF' },
    { value: 'semifinals', label: 'SF' },
    { value: 'finals', label: 'F' },
    { value: 'grandfinals', label: 'GF' }
];

export default function BanPickControls({
    banPickState,
    mapPoolSettings,
    onTeamChange,
    onActionChange,
    onSeasonChange,
    onCategoryChange,
    onReset
}: BanPickControlsProps) {
    const teamOptions = [
        { value: 'red', label: '红队' },
        { value: 'blue', label: '蓝队' }
    ];

    const actionOptions = [
        { value: 'ban', label: 'Ban' },
        { value: 'pick', label: 'Pick' }
    ];

    const seasonOptions = [
        { value: 's1', label: '第1赛季' }
    ];

    return (
        <div className="bg-gray-800/80 p-4 rounded-lg border border-gray-600">
            <h3 className="text-white text-lg font-bold mb-4">Ban/Pick 控制面板</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* 队伍选择 */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        当前操作队伍
                    </label>
                    <Dropdown
                        options={teamOptions}
                        value={banPickState.currentTeam}
                        onChange={(value) => onTeamChange(value as 'red' | 'blue')}
                        darkMode={true}
                        minWidth="8rem"
                    />
                </div>

                {/* 操作类型选择 */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        当前操作类型
                    </label>
                    <Dropdown
                        options={actionOptions}
                        value={banPickState.currentAction}
                        onChange={(value) => onActionChange(value as 'ban' | 'pick')}
                        darkMode={true}
                        minWidth="8rem"
                    />
                </div>

                {/* 赛季选择 */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        赛季
                    </label>
                    <Dropdown
                        options={seasonOptions}
                        value={mapPoolSettings.season}
                        onChange={onSeasonChange}
                        darkMode={true}
                        minWidth="8rem"
                    />
                </div>

                {/* 类别选择 */}
                <div>
                    <label className="block text-white text-sm font-medium mb-2">
                        类别
                    </label>
                    <Dropdown
                        options={CATEGORY_OPTIONS}
                        value={mapPoolSettings.category}
                        onChange={onCategoryChange}
                        darkMode={true}
                        minWidth="8rem"
                    />
                </div>
            </div>

            {/* 状态信息 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-red-500/20 p-3 rounded border border-red-500">
                    <div className="text-white text-sm font-medium">红队</div>
                    <div className="text-white">
                        Ban: {banPickState.remainingBans.red} | Pick: {banPickState.remainingPicks.red}
                    </div>
                </div>
                <div className="bg-blue-500/20 p-3 rounded border border-blue-500">
                    <div className="text-white text-sm font-medium">蓝队</div>
                    <div className="text-white">
                        Ban: {banPickState.remainingBans.blue} | Pick: {banPickState.remainingPicks.blue}
                    </div>
                </div>
            </div>

            {/* 操作历史 */}
            <div className="mb-4">
                <label className="block text-white text-sm font-medium mb-2">
                    操作历史
                </label>
                <div className="bg-gray-700/50 p-3 rounded max-h-32 overflow-y-auto">
                    {banPickState.history.length === 0 ? (
                        <div className="text-gray-400 text-sm">暂无操作记录</div>
                    ) : (
                        banPickState.history.slice(-5).reverse().map((record, index) => (
                            <div key={index} className="text-white text-sm mb-1">
                                <span className={record.team === 'red' ? 'text-red-400' : 'text-blue-400'}>
                                    {record.team === 'red' ? '红队' : '蓝队'}
                                </span>
                                <span className="mx-2">
                                    {record.action === 'ban' ? 'Ban' : 'Pick'}
                                </span>
                                <span className="text-gray-300">
                                    #{record.beatmapId}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 重置按钮 */}
            <div className="flex justify-end">
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                    重置Ban/Pick状态
                </button>
            </div>
        </div>
    );
}
