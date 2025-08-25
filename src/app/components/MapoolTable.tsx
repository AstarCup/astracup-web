interface MapoolTableProps {
    data: any[];
    title: string;
    downloadUrl?: string;
}

export default function MapoolTable({ data, title, downloadUrl }: MapoolTableProps) {
    return (
        <div className="mb-20">
            <h1 className="text-3xl font-bold mb-6">{title}</h1>
            {downloadUrl && (
                <a href={downloadUrl} className="absolute right-6 px-6 py-3 bg-[#F38181] text-white hover:bg-[#95E1D3] transition">
                    图包下载
                </a>
            )}
            <div className="overflow-x-auto mt-13">
                <table className="table-fixed min-w-[1400px]">
                    <thead>
                        <tr>
                            <th>MOD位</th>
                            <th>BID</th>
                            <th>封面</th>
                            <th className="w-1/4">歌曲名</th>
                            <th className="w-1/9">难度名</th>
                            <th className="w-20">星级</th>
                            <th className="w-20">AR</th>
                            <th className="w-20">OD</th>
                            <th className="w-20">CS</th>
                            <th className="w-20">HP</th>
                            <th>时长</th>
                            <th>地图链接</th>
                            <th>备注</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx}>
                                <td>{row.mode}</td>
                                <td>{row.beatmap_id}</td>
                                <td>
                                    <img src={`https://b.ppy.sh/thumb/${row.beatmapset_id}l.jpg`} alt="Cover"
                                        className="w-20 h-12 object-cover" />
                                </td>
                                <td>{row.title}</td>
                                <td>{row.version}</td>
                                <td>{row.rating}</td>
                                <td>{row.diff_approach}</td>
                                <td>{row.diff_overall}</td>
                                <td>{row.diff_size}</td>
                                <td>{row.diff_drain}</td>
                                <td>
                                    {Math.floor(row.total_length / 60)}:
                                    {(row.total_length % 60).toString().padStart(2, "0")}
                                </td>
                                <td>
                                    <a href={`https://osu.ppy.sh/beatmaps/${row.beatmap_id}`} target="_blank"
                                        rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                        链接
                                    </a>
                                </td>
                                <td>{row.note || ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}