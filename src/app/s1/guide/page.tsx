export default function Guide() {
    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">赛事手册</h1>
            <h2 className="text-2xl font-bold mt-20 mb-6">赛事信息</h2>
            <div className="max-w-4xl text-left space-y-4">
                <p>1. 比赛名称：AstraCup 星域杯</p>
                <p>2. 比赛时间：</p>
                <ul className="list-disc list-inside">
                    <li>报名时间：2025年10月1日 - 2025年10月15日</li>
                    <li>小组赛：2025年10月20日 - 2025年11月10日</li>
                    <li>淘汰赛：2025年11月15日 - 2025年12月1日</li>
                    <li>决赛：2025年12月5日</li>
                </ul>
                <p>3. 比赛地点：线上（使用 osu!lazer 平台）</p>
                <p>4. 参赛资格：</p>
                <ul className="list-disc list-inside">
                    <li>所有 osu!lazer std 玩家均可报名参加。</li>
                    <li>参赛选手需具备稳定的网络连接和符合比赛要求的硬件设备。</li>
                </ul>
                <p>5. 比赛规则：</p>
                <ul className="list-disc list-inside">
                    <li>比赛采用小组赛 + 淘汰赛 + 决赛的形式进行。</li>
                    <li>每场比赛将使用预先指定的谱面，选手需在规定时间内完成比赛。</li>
                    <li>比赛成绩将根据选手的得分和准确率进行排名。</li>
                </ul>
                <p>6. 奖励设置：</p>
                <ul className="list-disc list-inside">
                    <li>冠军：奖杯 + 500美元奖金 + 赞助商提供的奖品</li>
                    <li>亚军：300美元奖金 + 赞助商提供的奖品</li>
                    <li>季军：100美元奖金 + 赞助商提供的奖品</li>
                    <li>所有参赛选手将获得电子证书以表彰其参与。</li>
                </ul>
                <p>7. 报名方式：</p>
                <ul className="list-disc list-inside">
                    <li>选手需填写在线报名表，提供基本信息和 osu!lazer 用户名。</li>
                    <li>报名成功后，选手将收到确认邮件和比赛相关信息。</li>
                </ul>
                <p>8. 注意事项：</p>
                <ul className="list-disc list-inside">
                    <li>选手需遵守比赛规则和行为准则，任何作弊行为将导致取消资格。</li>
                    <li>比赛过程中如遇技术问题，选手应及时联系赛事管理员。</li>
                    <li>赛事最终解释权归 AstraCup 组委会所有。</li>
                </ul>
            </div>
        </div>

    );
}