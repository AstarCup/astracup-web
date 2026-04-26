# AstaraCup API 文档

> 自动生成于 2026-04-26 13:59
> 共 61 个接口

## 接口列表

### `POST` /api/admin/approve-registration

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Body | osuId |
| 示例 | https://www.rino.ink/api/admin/approve-registration |

---

### `POST` /api/admin/delete-registration

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Body | osuId |
| 示例 | https://www.rino.ink/api/admin/delete-registration |

---

### `POST` /api/admin/update-user-group

> 验证用户会话

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Body | osuId, userGroup |
| 示例 | https://www.rino.ink/api/admin/update-user-group |

---

### `GET` /api/admin/users

> 验证用户会话

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| 示例 | https://www.rino.ink/api/admin/users |

---

### `GET` /api/approved-players

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| 示例 | https://www.rino.ink/api/approved-players |

---

### `GET` /api/auth/callback/osu

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Query | code, error |
| 示例 | https://www.rino.ink/api/auth/callback/osu |

---

### `POST` /api/auth/logout

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/auth/logout |

---

### `GET` /api/auth/url

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/auth/url |

---

### `GET` /api/available-rooms-for-staff

> GET /api/available-rooms-for-staff - 获取可供staff选择的房间列表

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| 示例 | https://www.rino.ink/api/available-rooms-for-staff |

---

### `POST` /api/calculate-mod-stats

> 从osu! API获取beatmap文件内容

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/calculate-mod-stats |

---

### `GET` /api/check-registration

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | osuId |
| 示例 | https://www.rino.ink/api/check-registration |

---

### `POST` /api/content-detect

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/content-detect |

---

### `GET` /api/download-all-replays

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | season, category |
| 示例 | https://www.rino.ink/api/download-all-replays |

---

### `GET` /api/download-beatmap

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | sid, source |
| 示例 | https://www.rino.ink/api/download-beatmap |

---

### `GET` /api/download-blob

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | path |
| 示例 | https://www.rino.ink/api/download-blob |

---

### `POST` /api/get-user-info

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/get-user-info |

---

### `GET` /api/guide

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | season |
| 示例 | https://www.rino.ink/api/guide |

---

### `GET` /api/map-ratings/batch-comments

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | mapSelectionIds |
| 示例 | https://www.rino.ink/api/map-ratings/batch-comments |

---

### `GET` /api/map-ratings/batch

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | mapSelectionIds |
| 示例 | https://www.rino.ink/api/map-ratings/batch |

---

### `GET | POST | DELETE` /api/map-ratings

> GET — 获取指定选图的评论

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Query | mapSelectionId, id, userId |
| 示例 | https://www.rino.ink/api/map-ratings |

---

### `POST` /api/map-selections/bulk-approve

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Body | selectionIds, approved, selectedBy |
| 示例 | https://www.rino.ink/api/map-selections/bulk-approve |

---

### `GET | POST | DELETE | PUT` /api/map-selections

> GET — 获取选图列表

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Query | season, category, osuId, approved, padding, id, selectedBy |
| 示例 | https://www.rino.ink/api/map-selections |

---

### `GET` /api/mappool

> 构建图池文件路径

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | season |
| 示例 | https://www.rino.ink/api/mappool |

---

### `DELETE` /api/match-rooms/delete

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| 示例 | https://www.rino.ink/api/match-rooms/delete |

---

### `GET | POST` /api/match-rooms

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Query | withSchedules |
| Body | room_name, round_number, match_date, match_time, match_number, max_participants, description |
| 示例 | https://www.rino.ink/api/match-rooms |

---

### `POST` /api/match-schedules/admin-create

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Body | room_id, player1_osuId, player1_username, player2_osuId, player2_username, red_player_osuId, blue_player_osuId, red_score, blue_score, status, replay_link, match_link, referee_osuId, referee_username, commentator_osuId, commentator_username |
| 示例 | https://www.rino.ink/api/match-schedules/admin-create |

---

### `POST` /api/match-schedules/create

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Body | matchup_id, room_id |
| 示例 | https://www.rino.ink/api/match-schedules/create |

---

### `GET | POST` /api/match-schedules

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Body | // 通用字段
      matchup_id, room_id, // 管理员专用字段
      player1_osuId, player1_username, player2_osuId, player2_username, red_player_osuId, blue_player_osuId, red_score, blue_score, status, replay_link, match_link, referee_osuId, referee_username, commentator_osuId, commentator_username, // 功能标志
      send_notification, // 是否发送消息通知
      is_admin_create, // 是否管理员创建模式 |
| 示例 | https://www.rino.ink/api/match-schedules |

---

### `POST` /api/match-schedules/update-details

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Body | id, red_score, blue_score, match_link, replay_link, stream_link, status |
| 示例 | https://www.rino.ink/api/match-schedules/update-details |

---

### `POST` /api/match-schedules/update

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Body | id, status, ...additionalData |
| 示例 | https://www.rino.ink/api/match-schedules/update |

---

### `POST | GET` /api/match-scores/save

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | roomId |
| Body | room, scores, osuId |
| 示例 | https://www.rino.ink/api/match-scores/save |

---

### `POST` /api/match-scores/update

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Body | room, scores, osuId |
| 示例 | https://www.rino.ink/api/match-scores/update |

---

### `GET | POST` /api/messages

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Body | messageId, action |
| 示例 | https://www.rino.ink/api/messages |

---

### `GET` /api/multiplayer/rooms/:roomId/playlists/:playlistId/scores

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/multiplayer/rooms/:roomId/playlists/:playlistId/scores |

---

### `GET` /api/multiplayer/rooms

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | roomIds |
| 示例 | https://www.rino.ink/api/multiplayer/rooms |

---

### `POST` /api/multiplayer/rooms/scores

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Body | roomIds, startDate, endDate, onlyValid |
| 示例 | https://www.rino.ink/api/multiplayer/rooms/scores |

---

### `GET` /api/news

> 获取分页参数

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | page |
| 示例 | https://www.rino.ink/api/news |

---

### `GET` /api/obs-overlay/players

> 获取所有用户信息

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/obs-overlay/players |

---

### `POST` /api/parse-beatmap

> POST - 解析beatmap URL并返回beatmap信息

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| 示例 | https://www.rino.ink/api/parse-beatmap |

---

### `POST` /api/parse-osz

> 处理OPTIONS预检请求

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| 示例 | https://www.rino.ink/api/parse-osz |

---

### `DELETE` /api/player-matchups/delete

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| 示例 | https://www.rino.ink/api/player-matchups/delete |

---

### `GET | POST | PUT | DELETE` /api/player-matchups

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Query | id |
| Body | player1_osuId, player1_username, player2_osuId, player2_username, id, status |
| 示例 | https://www.rino.ink/api/player-matchups |

---

### `GET` /api/player-next-match

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| 示例 | https://www.rino.ink/api/player-next-match |

---

### `GET` /api/rank-config

> 检查是否在生产环境且有Edge Config连接字符串

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/rank-config |

---

### `POST | GET` /api/register

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/register |

---

### `POST` /api/replay-check

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/replay-check |

---

### `POST` /api/request-match

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Body | matchupId, roomId |
| 示例 | https://www.rino.ink/api/request-match |

---

### `GET` /api/season-config

> 根据当前赛季生成可用的赛季选项

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/season-config |

---

### `POST` /api/session/clear

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/session/clear |

---

### `GET` /api/session/get

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| 示例 | https://www.rino.ink/api/session/get |

---

### `POST` /api/session/set

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/session/set |

---

### `PUT | DELETE` /api/staff-room-assignments/:id

> PUT /api/staff-room-assignments/[id] - 更新staff房间分配状态 (已禁用，从match_schedules表获取)

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/staff-room-assignments/:id |

---

### `GET | POST | DELETE` /api/staff-room-assignments

> GET /api/staff-room-assignments - 获取所有staff房间分配

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Query | roomId, assignmentId |
| Body | room_id, staff_osuId, staff_username, staff_role, assigned_by |
| 示例 | https://www.rino.ink/api/staff-room-assignments |

---

### `GET | POST` /api/tournament-settings

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| 示例 | https://www.rino.ink/api/tournament-settings |

---

### `POST | DELETE` /api/upload-replay

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| 示例 | https://www.rino.ink/api/upload-replay |

---

### `POST` /api/upload-url

> 处理OPTIONS预检请求

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| 示例 | https://www.rino.ink/api/upload-url |

---

### `GET` /api/uploaded-users

> 获取用户session

| 属性 | 值 |
|------|----|
| 鉴权 | Admin |
| Query | season, category |
| 示例 | https://www.rino.ink/api/uploaded-users |

---

### `GET` /api/user-permissions

> 如果提供了URL参数，直接使用（用于管理功能）

| 属性 | 值 |
|------|----|
| 鉴权 | Auth |
| Query | osuId |
| 示例 | https://www.rino.ink/api/user-permissions |

---

### `GET` /api/user-registration

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| Query | osuId |
| 示例 | https://www.rino.ink/api/user-registration |

---

### `POST` /api/user/register

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/user/register |

---

### `GET` /api/version

> 读取构建时生成的版本文件

| 属性 | 值 |
|------|----|
| 鉴权 | None |
| 示例 | https://www.rino.ink/api/version |

---

