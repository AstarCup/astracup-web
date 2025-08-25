import qua from '@/app/s1/mapool/qua.json';

import MapoolTable from '@/app/components/MapoolTable';

export default function Mapool() {
    // 假设 pua.json 结构和 qua.json 一致
    const quaData = Array.isArray(qua) ? qua : [qua];
    return (
        <div className="max-w-9xl mx-auto p-6">
            <MapoolTable data={quaData} title="QUA图池" downloadUrl="/" />
        </div>
    );
}