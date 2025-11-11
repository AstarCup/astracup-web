declare global {
    interface Window {
        obsstudio?: {
            // 获取场景列表
            getScenes: (callback: (scenes: string[]) => void) => void;
            // 获取当前场景
            getCurrentScene: (callback: (scene: { name: string }) => void) => void;
            // 切换场景
            setCurrentScene: (sceneName: string) => void;
            // 监听场景变化（旧版API，推荐使用事件监听器）
            onCurrentSceneChanged: (callback: (sceneName: string) => void) => void;
            // 其他可能的OBS API方法
            pluginVersion?: string;
            getControlLevel?: (callback: (level: number) => void) => void;
            getStatus?: (callback: (status: any) => void) => void;
        };
    }
}

export {};
