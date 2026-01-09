// 难度星数颜色映射 (0.0 - 9.0，每0.1一个间隔)
// 格式: { [星数]: [R, G, B, A] }
const DIFFICULTY_COLOR_MAP: { [key: string]: [number, number, number, number] } = {
    "0.0": [66, 142, 249, 255],
    "0.1": [67, 148, 255, 255],
    "0.2": [68, 152, 255, 255],
    "0.3": [69, 156, 255, 255],
    "0.4": [70, 159, 255, 255],
    "0.5": [71, 163, 255, 255],
    "0.6": [72, 167, 255, 255],
    "0.7": [73, 171, 255, 255],
    "0.8": [74, 175, 255, 255],
    "0.9": [75, 179, 255, 255],
    "1.0": [76, 183, 255, 255],
    "1.1": [77, 186, 255, 255],
    "1.2": [78, 190, 255, 255],
    "1.3": [79, 197, 252, 255],
    "1.4": [79, 205, 247, 255],
    "1.5": [79, 213, 241, 255],
    "1.6": [79, 222, 235, 255],
    "1.7": [79, 230, 230, 255],
    "1.8": [79, 238, 224, 255],
    "1.9": [79, 247, 218, 255],
    "2.0": [79, 255, 212, 255],
    "2.1": [88, 255, 186, 255],
    "2.2": [97, 255, 158, 255],
    "2.3": [106, 255, 132, 255],
    "2.4": [116, 255, 104, 255],
    "2.5": [124, 255, 79, 255],
    "2.6": [139, 253, 81, 255],
    "2.7": [156, 251, 82, 255],
    "2.8": [170, 249, 84, 255],
    "2.9": [185, 247, 86, 255],
    "3.0": [201, 246, 87, 255],
    "3.1": [216, 244, 89, 255],
    "3.2": [231, 242, 90, 255],
    "3.3": [246, 240, 92, 255],
    "3.4": [247, 227, 93, 255],
    "3.5": [248, 215, 95, 255],
    "3.6": [249, 202, 96, 255],
    "3.7": [250, 190, 97, 255],
    "3.8": [251, 177, 99, 255],
    "3.9": [252, 165, 100, 255],
    "4.0": [253, 153, 101, 255],
    "4.1": [254, 140, 103, 255],
    "4.2": [255, 128, 104, 255],
    "4.3": [255, 121, 105, 255],
    "4.4": [255, 113, 106, 255],
    "4.5": [255, 106, 107, 255],
    "4.6": [255, 99, 108, 255],
    "4.7": [255, 92, 109, 255],
    "4.8": [255, 85, 110, 255],
    "4.9": [255, 78, 111, 255],
    "5.0": [249, 77, 119, 255],
    "5.1": [242, 76, 127, 255],
    "5.2": [236, 75, 135, 255],
    "5.3": [229, 74, 144, 255],
    "5.4": [223, 73, 152, 255],
    "5.5": [217, 72, 160, 255],
    "5.6": [210, 71, 168, 255],
    "5.7": [204, 70, 176, 255],
    "5.8": [198, 69, 184, 255],
    "5.9": [187, 72, 188, 255],
    "6.0": [176, 76, 193, 255],
    "6.1": [165, 79, 197, 255],
    "6.2": [155, 82, 201, 255],
    "6.3": [144, 86, 205, 255],
    "6.4": [133, 89, 210, 255],
    "6.5": [122, 92, 214, 255],
    "6.6": [112, 96, 218, 255],
    "6.7": [101, 99, 222, 255],
    "6.8": [93, 91, 214, 255],
    "6.9": [85, 83, 206, 255],
    "7.0": [78, 75, 198, 255],
    "7.1": [70, 68, 190, 255],
    "7.2": [62, 59, 181, 255],
    "7.3": [55, 52, 174, 255],
    "7.4": [47, 44, 166, 255],
    "7.5": [39, 36, 158, 255],
    "7.6": [31, 28, 150, 255],
    "7.7": [24, 21, 142, 255],
    "7.8": [22, 19, 131, 255],
    "7.9": [20, 18, 120, 255],
    "8.0": [18, 16, 109, 255],
    "8.1": [17, 14, 98, 255],
    "8.2": [15, 13, 87, 255],
    "8.3": [13, 11, 76, 255],
    "8.4": [11, 10, 65, 255],
    "8.5": [9, 8, 54, 255],
    "8.6": [7, 6, 43, 255],
    "8.7": [6, 5, 33, 255],
    "8.8": [4, 3, 21, 255],
    "8.9": [2, 2, 10, 255],
    "9.0": [1, 1, 1, 255]
};

// 线性插值函数
const lerp = (start: number, end: number, t: number): number => {
    return start + (end - start) * t;
};

// 颜色插值函数
const interpolateColor = (
    color1: [number, number, number, number],
    color2: [number, number, number, number],
    t: number
): [number, number, number, number] => {
    return [
        Math.round(lerp(color1[0], color2[0], t)),
        Math.round(lerp(color1[1], color2[1], t)),
        Math.round(lerp(color1[2], color2[2], t)),
        Math.round(lerp(color1[3], color2[3], t))
    ];
};

// 查找相邻的两个关键点
const findNearestKeys = (starRating: number): { lower: number; upper: number } => {
    const keys = Object.keys(DIFFICULTY_COLOR_MAP).map(Number).sort((a, b) => a - b);

    // 边界情况
    if (starRating <= keys[0]) return { lower: keys[0], upper: keys[0] };
    if (starRating >= keys[keys.length - 1]) return { lower: keys[keys.length - 1], upper: keys[keys.length - 1] };

    // 查找相邻关键点
    for (let i = 0; i < keys.length - 1; i++) {
        if (starRating >= keys[i] && starRating <= keys[i + 1]) {
            return { lower: keys[i], upper: keys[i + 1] };
        }
    }

    // 默认返回第一个和最后一个
    return { lower: keys[0], upper: keys[keys.length - 1] };
};

/**
 * 根据难度星数获取对应的 RGBA 颜色字符串
 * @param starRating 难度星数 (0.0 - 9.0)
 * @returns RGBA 颜色字符串，如 "rgba(66, 142, 249, 1)"
 */
export const getDifficultyColor = (starRating: number): string => {
    // 边界处理
    if (starRating < 0) starRating = 0;
    if (starRating > 9.0) starRating = 9.0;

    // 精确匹配
    const exactKey = starRating.toFixed(1);
    if (DIFFICULTY_COLOR_MAP[exactKey]) {
        const [r, g, b, a] = DIFFICULTY_COLOR_MAP[exactKey];
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    }

    // 查找相邻关键点
    const { lower, upper } = findNearestKeys(starRating);

    // 如果是同一个点（边界情况）
    if (lower === upper) {
        const [r, g, b, a] = DIFFICULTY_COLOR_MAP[lower.toFixed(1)];
        return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
    }

    // 计算插值比例
    const t = (starRating - lower) / (upper - lower);

    // 获取颜色并插值
    const lowerColor = DIFFICULTY_COLOR_MAP[lower.toFixed(1)];
    const upperColor = DIFFICULTY_COLOR_MAP[upper.toFixed(1)];
    const [r, g, b, a] = interpolateColor(lowerColor, upperColor, t);

    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
};

/**
 * 将 RGB 颜色转换为十六进制格式
 * @param r 红色值 (0-255)
 * @param g 绿色值 (0-255)
 * @param b 蓝色值 (0-255)
 * @returns 十六进制颜色字符串，如 "#428ef9"
 */
const rgbToHex = (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

/**
 * 根据难度星数获取对应的颜色类名
 * 返回 Tailwind CSS 的任意值类名，如 "bg-[#428ef9]"
 * @param starRating 难度星数 (0.0 - 9.0)
 * @returns Tailwind CSS 颜色类名
 */
export const getDifficultyColorClass = (starRating: number): string => {
    // 边界处理
    if (starRating < 0) starRating = 0;
    if (starRating > 9.0) starRating = 9.0;

    // 精确匹配
    const exactKey = starRating.toFixed(1);
    if (DIFFICULTY_COLOR_MAP[exactKey]) {
        const [r, g, b] = DIFFICULTY_COLOR_MAP[exactKey];
        const hexColor = rgbToHex(r, g, b);
        return `text-[${hexColor}]`;
    }

    // 查找相邻关键点
    const { lower, upper } = findNearestKeys(starRating);

    // 如果是同一个点（边界情况）
    if (lower === upper) {
        const [r, g, b] = DIFFICULTY_COLOR_MAP[lower.toFixed(1)];
        const hexColor = rgbToHex(r, g, b);
        return `text-[${hexColor}]`;
    }

    // 计算插值比例
    const t = (starRating - lower) / (upper - lower);

    // 获取颜色并插值
    const lowerColor = DIFFICULTY_COLOR_MAP[lower.toFixed(1)];
    const upperColor = DIFFICULTY_COLOR_MAP[upper.toFixed(1)];
    const [r, g, b] = interpolateColor(lowerColor, upperColor, t);

    const hexColor = rgbToHex(r, g, b);
    console.log(`星数: ${starRating}, 颜色: ${hexColor}`);
    return `text-[${hexColor}]`;
};

/**
 * 根据难度星数获取对应的内联样式对象
 * @param starRating 难度星数 (0.0 - 9.0)
 * @returns React 内联样式对象
 */
export const getDifficultyStyle = (starRating: number): React.CSSProperties => {
    return {
        color: getDifficultyColor(starRating), // 根据背景色深浅选择文字颜色
        borderColor: getDifficultyColor(starRating),
        borderStyle: 'solid',
        borderRadius: '0.5rem',
        borderBottomWidth: '4px',
    };
};

/**
 * 根据难度星数获取对应的文字颜色类名
 * @param starRating 难度星数 (0.0 - 9.0)
 * @returns Tailwind CSS 文字颜色类名
 */
export const getDifficultyTextColorClass = (starRating: number): string => {
    // 对于深色背景使用白色文字，浅色背景使用黑色文字
    if (starRating > 6.0) return 'text-white';  // 深色背景
    return 'text-gray-900';                     // 浅色背景
};