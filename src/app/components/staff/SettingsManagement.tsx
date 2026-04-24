"use client";

import { useState, useEffect } from "react";
import { showSuccess, showError } from "@/app/components/ui/Notification";
import Dropdown from "@/app/components/ui/Dropdown";
import Image from "next/image";

interface TournamentSettings {
  id?: number;
  tournament_name: string;
  max_pp_for_registration: number;
  min_pp_for_registration: number;
  current_season: string;
  current_season_stage: string;
  registration_enabled: boolean;
  mappool_visible: boolean;
}

interface UserWithGroup {
  osuId: string;
  username: string;
  avatar_url: string | null;
  userGroup: "player" | "admin";
}

interface UserInfo {
  id: number;
  username: string;
  avatar_url: string;
  country_code: string;
  pp: number;
  global_rank: number | null;
}

interface SettingsManagementProps {
  userOsuId: string;
  isAdmin: boolean;
}

export default function SettingsManagement({
  userOsuId,
  isAdmin,
}: SettingsManagementProps) {
  const [settings, setSettings] = useState<TournamentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TournamentSettings>({
    tournament_name: "",
    max_pp_for_registration: 7000,
    min_pp_for_registration: 0,
    current_season: "s1",
    current_season_stage: "registration",
    registration_enabled: true,
    mappool_visible: false,
  });

  // 用户管理状态
  const [users, setUsers] = useState<UserWithGroup[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentGroupType, setCurrentGroupType] = useState<
    "admin_group" | null
  >(null);
  const [userIdInput, setUserIdInput] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [initializingDatabase, setInitializingDatabase] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<string>("");

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        showError(data.error || "获取用户列表失败");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      showError("获取用户列表失败");
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tournament-settings");
      const data = await response.json();

      if (data.success) {
        setSettings(data.settings);
        // 确保所有字段都有默认值
        const settingsWithDefaults = {
          tournament_name:
            data.settings.tournament_name !== undefined
              ? data.settings.tournament_name
              : "",
          max_pp_for_registration:
            data.settings.max_pp_for_registration !== undefined
              ? data.settings.max_pp_for_registration
              : 7000,
          min_pp_for_registration:
            data.settings.min_pp_for_registration !== undefined
              ? data.settings.min_pp_for_registration
              : 0,
          current_season:
            data.settings.current_season !== undefined
              ? data.settings.current_season
              : "s1",
          current_season_stage:
            data.settings.current_season_stage !== undefined
              ? data.settings.current_season_stage
              : "registration",
          registration_enabled:
            data.settings.registration_enabled !== undefined
              ? data.settings.registration_enabled
              : true,
          mappool_visible:
            data.settings.mappool_visible !== undefined
              ? data.settings.mappool_visible
              : false,
        };
        setFormData(settingsWithDefaults);
      } else {
        showError(data.error || "获取设置失败");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      showError("获取设置失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      showError("权限不足");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/tournament-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess("设置保存成功");
        fetchSettings(); // 重新获取最新设置
      } else {
        showError(data.error || "保存失败");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      showError("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUserGroup = async (
    osuId: string,
    newGroup: "player" | "admin",
  ) => {
    if (
      !window.confirm(
        `确定要将用户 ${osuId} 的权限组改为 ${newGroup === "admin" ? "管理员" : "玩家"} 吗？`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/admin/update-user-group", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ osuId, userGroup: newGroup }),
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`用户权限组更新成功`);
        // 刷新用户列表
        fetchUsers();
      } else {
        showError(data.error || "更新用户权限组失败");
      }
    } catch (error) {
      console.error("Error updating user group:", error);
      showError("更新用户权限组失败");
    }
  };

  // 注意：handleAddUser函数已移除，因为权限管理现在通过userGroup字段进行
  // 使用handleUpdateUserGroup函数来更新用户权限组

  const handleFetchUser = async () => {
    if (!userIdInput.trim()) {
      showError("请输入用户ID");
      return;
    }

    try {
      setFetchingUser(true);
      const response = await fetch("/api/get-user-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userIdInput.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.user);
      } else {
        showError(data.error || "获取用户信息失败");
        setUserInfo(null);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      showError("获取用户信息失败");
      setUserInfo(null);
    } finally {
      setFetchingUser(false);
    }
  };

  const openAddModal = (groupType: "admin_group") => {
    setCurrentGroupType(groupType);
    setShowAddModal(true);
    setUserIdInput("");
    setUserInfo(null);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setCurrentGroupType(null);
    setUserIdInput("");
    setUserInfo(null);
  };

  const handleInitializeDatabase = async () => {
    if (!isAdmin) {
      showError("权限不足");
      return;
    }

    try {
      setInitializingDatabase(true);
      setDatabaseStatus("正在初始化数据库...");

      const response = await fetch("/api/admin/init-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setDatabaseStatus("数据库初始化成功！");
        showSuccess("数据库初始化成功");
      } else {
        setDatabaseStatus(`初始化失败: ${data.error}`);
        showError(data.error || "数据库初始化失败");
      }
    } catch (error) {
      console.error("Error initializing database:", error);
      setDatabaseStatus("初始化过程中发生错误");
      showError("数据库初始化失败");
    } finally {
      setInitializingDatabase(false);
    }
  };

  const getGroupName = (groupType: "admin_group") => {
    switch (groupType) {
      case "admin_group":
        return "管理员组";
      default:
        return "未知组";
    }
  };

  const renderUserManagement = () => {
    const adminUsers = users.filter((user) => user.userGroup === "admin");
    const playerUsers = users.filter((user) => user.userGroup === "player");
    const filteredPlayerUsers = searchQuery
      ? playerUsers.filter(
          (user) =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.osuId.includes(searchQuery),
        )
      : playerUsers;

    const UserCard = ({
      user,
      isAdmin,
    }: {
      user: UserWithGroup;
      isAdmin: boolean;
    }) => (
      <div className="bg-white dark:bg-white-extra border border-action rounded-lg p-4 transition-all hover:scale-[1.02] hover:shadow-md active:scale-[0.99] flex flex-col items-center gap-3 text-center">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-action flex items-center justify-center text-sm text-text-secondary font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col items-center min-w-0">
          <span className="text-text text-sm font-medium truncate max-w-[120px]">
            {user.username}
          </span>
          <span className="text-text-secondary text-xs">ID: {user.osuId}</span>
        </div>
        {isAdmin ? (
          <button
            onClick={() => handleUpdateUserGroup(user.osuId, "player")}
            className="w-full px-3 py-1.5 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
          >
            移除管理员
          </button>
        ) : (
          <button
            onClick={() => handleUpdateUserGroup(user.osuId, "admin")}
            className="w-full px-3 py-1.5 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
          >
            设为管理员
          </button>
        )}
      </div>
    );

    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-text font-medium">管理员列表</h3>
            <span className="text-text-secondary text-xs">
              {adminUsers.length} 人
            </span>
          </div>
          {adminUsers.length === 0 ? (
            <div className="bg-white dark:bg-white-extra border border-action rounded-lg p-6 text-center">
              <p className="text-text-secondary text-sm">暂无管理员</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {adminUsers.map((user) => (
                <UserCard key={user.osuId} user={user} isAdmin={true} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-text font-medium">玩家列表</h3>
            <span className="text-text-secondary text-xs">
              {playerUsers.length} 人
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="搜索用户名或ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-white dark:bg-white-extra border border-action rounded-md text-text text-sm focus:border-highlight focus:outline-none"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {filteredPlayerUsers.length === 0 && playerUsers.length > 0 ? (
            <div className="bg-white dark:bg-white-extra border border-action rounded-lg p-6 text-center">
              <p className="text-text-secondary text-sm">没有匹配的用户</p>
            </div>
          ) : playerUsers.length === 0 ? (
            <div className="bg-white dark:bg-white-extra border border-action rounded-lg p-6 text-center">
              <p className="text-text-secondary text-sm">暂无玩家</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredPlayerUsers.map((user) => (
                <UserCard key={user.osuId} user={user} isAdmin={false} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-white-extra border-b-4 border-highlight rounded-lg p-6 transition-all hover:scale-[1.01] active:scale-[0.99]">
          <h3 className="text-xl font-bold text-text mb-4 flex items-center">
            <div className="w-2 h-2 bg-highlight rounded-full mr-3"></div>
            系统设置
          </h3>
          <div className="bg-background/30 p-4 border border-action rounded-lg">
            <div className="flex justify-center items-center py-8">
              <Image
                src="/icons/loading.svg"
                alt="loading"
                width={120}
                height={120}
                className="animate-spin"
              />
              <span className="ml-2 text-text-secondary">加载中...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-white-extra border-b-4 border-highlight rounded-lg p-6">
        <h3 className="text-xl font-bold text-text mb-4 flex items-center">
          <div className="w-2 h-2 bg-highlight rounded-full mr-3"></div>
          比赛设置管理
        </h3>
        <div className="bg-background/30 p-6 border border-action rounded-lg space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                比赛名称 *
              </label>
              <input
                type="text"
                value={formData.tournament_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tournament_name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-white-extra border border-action rounded-md text-text focus:border-highlight focus:outline-none"
                placeholder="输入比赛名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                当前赛季
              </label>
              <Dropdown
                options={[
                  { value: "s1", label: "Season 1" },
                  { value: "s2", label: "Season 2" },
                  { value: "s3", label: "Season 3" },
                ]}
                value={formData.current_season}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, current_season: value }))
                }
                darkMode={true}
              />
            </div>
          </div>

          {/* PP分段设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                报名最低PP限制
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.min_pp_for_registration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    min_pp_for_registration: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-white-extra border border-action rounded-md text-text focus:border-highlight focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                报名最高PP限制
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={formData.max_pp_for_registration}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    max_pp_for_registration: parseFloat(e.target.value) || 7000,
                  }))
                }
                className="w-full px-3 py-2 bg-white dark:bg-white-extra border border-action rounded-md text-text focus:border-highlight focus:outline-none"
              />
            </div>
          </div>

          {/* 赛季阶段设置 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                当前赛季阶段
              </label>
              <Dropdown
                options={[
                  { value: "registration", label: "报名阶段" },
                  { value: "qualification", label: "资格赛阶段" },
                  { value: "group_stage", label: "小组赛阶段" },
                  { value: "playoffs", label: "淘汰赛阶段" },
                  { value: "finals", label: "决赛阶段" },
                  { value: "completed", label: "已结束" },
                ]}
                value={formData.current_season_stage}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    current_season_stage: value,
                  }))
                }
                darkMode={true}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="registration_enabled"
                  checked={formData.registration_enabled}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      registration_enabled: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-highlight bg-white dark:bg-white-extra border-action rounded focus:ring-highlight focus:ring-2"
                />
                <label
                  htmlFor="registration_enabled"
                  className="ml-2 text-sm text-text-secondary"
                >
                  当前阶段允许报名
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="mappool_visible"
                  checked={formData.mappool_visible}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      mappool_visible: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-highlight bg-white dark:bg-white-extra border-action rounded focus:ring-highlight focus:ring-2"
                />
                <label
                  htmlFor="mappool_visible"
                  className="ml-2 text-sm text-text-secondary"
                >
                  当前阶段显示图池
                </label>
              </div>
            </div>
          </div>

          {/* 用户权限管理 */}
          <div className="space-y-6">
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-highlight"></div>
              </div>
            ) : (
              renderUserManagement()
            )}
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !isAdmin}
              className="px-6 py-2 bg-white dark:bg-white-extra text-text rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 border-b-4 border-highlight hover:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-[0.99]"
            >
              {saving && (
                <Image
                  src="/icons/loading.svg"
                  alt="loading"
                  width={16}
                  height={16}
                  className="animate-spin"
                />
              )}
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}