import qua from '@/app/s1/mapool/MapPoolTest-qua.json';

import MapoolTable from '@/app/components/MapoolTable';

export default function Mapool() {
    const quaData = Array.isArray(qua) ? qua : [qua];
    return (
        <div className="max-w-9xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6 text-white">QUA图池</h1>
            <MapoolTable data={quaData} title="" downloadUrl="/" />
        </div>
    );
}