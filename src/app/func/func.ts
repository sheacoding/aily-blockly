/*
根据日期生成字符串，如 5月1日，生成为"may01"
*/
export function generateDateString(date: Date = new Date()): string {
    const monthAbbr = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    // 获取月份（getMonth 返回值为 0-11）
    const month = monthAbbr[date.getMonth()];
    // 获取日期并格式化为两位数字
    const day = date.getDate().toString().padStart(2, '0');
    // 返回形如 "may01" 的字符串
    return `${month}${day}`;
}

/*
验证路径是否有效，检查是否包含中文、空格、特殊字符
*/
export interface PathValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

export function validateProjectPath(path: string): PathValidationResult {
    if (!path || path.trim() === '') {
        return {
            isValid: false,
            errorMessage: '路径不能为空'
        };
    }

    // 检查中文字符
    const chineseRegex = /[\u4e00-\u9fa5]/;
    if (chineseRegex.test(path)) {
        return {
            isValid: false,
            errorMessage: '路径不能包含中文字符'
        };
    }

    // 检查空格
    if (path.includes(' ')) {
        return {
            isValid: false,
            errorMessage: '路径不能包含空格'
        };
    }

    // 检查特殊字符 (保留基本的路径分隔符，但不能在路径中间包含冒号)
    const invalidCharsRegex = /[<>"|?*]/;
    if (invalidCharsRegex.test(path)) {
        return {
            isValid: false,
            errorMessage: '路径不能包含特殊字符: < > " | ? *'
        };
    }

    // 检查冒号的位置 - 只能在盘符后面 (Windows) 或不存在 (Unix)
    const colonCount = (path.match(/:/g) || []).length;
    if (colonCount > 1 || (colonCount === 1 && !path.match(/^[a-zA-Z]:/))) {
        return {
            isValid: false,
            errorMessage: '路径格式不正确'
        };
    }

    // 检查是否为绝对路径 (Windows: C:\ 或 Unix: /)
    const absolutePathRegex = /^[a-zA-Z]:[\\\/]|^[\\\/]/;
    if (!absolutePathRegex.test(path)) {
        return {
            isValid: false,
            errorMessage: '必须是绝对路径'
        };
    }

    return {
        isValid: true
    };
}