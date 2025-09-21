// Dropdown 组件类型定义

export interface DropdownOption {
    /** 选项的值 */
    value: string;
    /** 显示的标签文本 */
    label: string;
    /** 可选的计数显示 */
    count?: number;
    /** 是否禁用此选项 */
    disabled?: boolean;
}

export interface DropdownProps {
    /** 下拉选项列表 */
    options: DropdownOption[];
    /** 当前选中的值 */
    value: string;
    /** 值变化时的回调函数 */
    onChange: (value: string) => void;
    /** 占位符文本 */
    placeholder?: string;
    /** 标签文本 */
    label?: string;
    /** 是否显示清除按钮 */
    showClearButton?: boolean;
    /** 清除按钮文本 */
    clearButtonText?: string;
    /** 容器的CSS类名 */
    className?: string;
    /** 按钮的CSS类名 */
    buttonClassName?: string;
    /** 下拉列表的CSS类名 */
    dropdownClassName?: string;
    /** 选项的CSS类名 */
    optionClassName?: string;
    /** 选中选项的CSS类名 */
    selectedOptionClassName?: string;
    /** 是否禁用整个组件 */
    disabled?: boolean;
    /** 下拉列表的最大高度 */
    maxHeight?: string;
    /** 按钮的最小宽度 */
    minWidth?: string;
}

export interface DropdownRef {
    /** 关闭下拉菜单 */
    close: () => void;
    /** 打开下拉菜单 */
    open: () => void;
    /** 切换下拉菜单状态 */
    toggle: () => void;
}

// 常用的预设选项类型
export interface StatusOption extends DropdownOption {
    value: 'active' | 'inactive' | 'pending' | 'suspended';
}

export interface PriorityOption extends DropdownOption {
    value: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SortOption extends DropdownOption {
    value: 'asc' | 'desc' | 'newest' | 'oldest' | 'popular';
}

// 工具类型
export type DropdownValue<T extends DropdownOption = DropdownOption> = T['value'];
export type DropdownChangeHandler<T extends DropdownOption = DropdownOption> = (value: DropdownValue<T>) => void;