import ScheduleTable from "@/app/components/ScheduleTable";
import scheduleData from "@/app/s1/schedule-data.json";
import { generatePageMetadata } from '../layout';
import { Metadata } from 'next';

export const metadata: Metadata = generatePageMetadata('/schedule');

export default function Schedule() {
    return (
        <div className="max-w-9xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">赛程安排</h1>

            <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-white">比赛时间表</h2>
                <div className="overflow-x-auto">
                    <ScheduleTable schedule={scheduleData.schedule} />
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-semibold mb-4 text-white">比赛对阵表</h2>

                <iframe src="https://challonge.com/zh_CN/MWC4K2025/module" width="100%" height="800"></iframe>
            </div>
        </div>
    );
}
