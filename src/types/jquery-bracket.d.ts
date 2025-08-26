declare module 'jquery-bracket/dist/jquery.bracket.min.js' {
    const content: any;
    export default content;
}

// 扩展JQuery接口以包含bracket方法
interface JQuery {
    bracket(options: any): JQuery;
}
