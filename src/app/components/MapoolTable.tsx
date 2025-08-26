"use client";
import Image from "next/image";
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
                <a href={downloadUrl} className="absolute right-6 px-5 py-3 bg-[#F38181] text-white hover:bg-[#95E1D3] transition">
                    图包下载
                </a>
            )}
            <div className="overflow-x-auto mt-13">
                <table className="table-fixed min-w-[1800px]">
                    <thead>
                        <tr className="sticky top-0 bg-white z-10">
                            <th className="w-10 flex-1">MOD</th>
                            <th className="w-16 flex-1">BID</th>
                            <th className="w-15 flex-2">封面</th>
                            <th className="w-80 flex-5">歌曲名</th>
                            <th className="w-15 flex-1">谱师</th>
                            <th className="w-15 flex-1">星级</th>
                            <th className="w-10 flex-1">AR</th>
                            <th className="w-10 flex-1">OD</th>
                            <th className="w-10 flex-1">CS</th>
                            <th className="w-10 flex-1">BPM</th>
                            <th className="w-10 flex-1">时长</th>
                            <th className="w-40 flex-none">备注</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => {
                            let bgClass = "";
                            let slotClass = "";
                            if (row.Slot?.includes("NM")) {
                                bgClass = "bg-white";
                                slotClass = "bg-gray-200 p-2 text-center font-bold";
                            } else if (row.Slot?.includes("HD")) {
                                bgClass = "text-yellow-500";
                                slotClass = "bg-yellow-300 p-2 text-black text-center font-bold";
                            } else if (row.Slot?.includes("HR")) {
                                bgClass = "text-red-500";
                                slotClass = "bg-red-400 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("DT")) {
                                bgClass = "text-purple-500";
                                slotClass = "bg-purple-400 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("FM")) {
                                bgClass = "text-green-500";
                                slotClass = "bg-green-500 p-2 text-white text-center font-bold";
                            } else if (row.Slot?.includes("TB")) {
                                bgClass = "text-grey-500";
                                slotClass = "bg-black p-2 text-white text-center font-bold";
                            }
                            return (
                                <tr key={idx} className={bgClass}>
                                    <td><a className={slotClass}>{row.Slot}</a></td>
                                    <td
                                        className="cursor-pointer text-[#F38181] hover:underline"
                                        title="点击复制BID"
                                        onClick={() => navigator.clipboard.writeText(row.BID)}
                                    >
                                        {row.BID}
                                    </td>
                                    <td className="overflow-hidden">
                                        <Image
                                            src={row.cover_base64 ? `data:image/jpeg;base64,${row.cover_base64}` : `https://assets.ppy.sh/beatmaps/${row.SID}/covers/cover.jpg`}
                                            alt="Cover"
                                            width={90}
                                            height={48}
                                            className="w-16 h-12 object-cover rounded"
                                            unoptimized
                                        />
                                    </td>
                                    <td><a
                                        href={`https://osu.ppy.sh/beatmaps/${row.BID}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-left hover:underline"
                                    >
                                        {row.MapInfo}
                                    </a></td>
                                    <td>{row._Creator}</td>
                                    <td>{row.SR}</td>
                                    <td>{row.AR}</td>
                                    <td>{row.OD}</td>
                                    <td>{row.CS}</td>
                                    <td>{Math.round(row.BPM)}</td>
                                    <td>{row.HitLength}</td>
                                    <td>{row.Notes || "-"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}