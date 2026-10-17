/**
 * Hexo 注入脚本：给每个页面挂上「媒体增强」
 *
 * 安装位置：博客根目录的 scripts/ 文件夹，Hexo 会自动加载
 *
 * 做了什么：
 *   1. <head> 里加 KaTeX 的样式表（23KB，全站常驻，公式不闪白）
 *   2. <head> 里加 source/js/media-enhance.js（2KB，defer 加载）
 *      —— 它负责把 <video>/<audio>/<model-viewer> 包成自适应容器，
 *         并按需加载 KaTeX 把 $$...$$、$...$、\(...\) 渲染成公式
 *
 * 为什么不直接把 katex.min.js 也写进 <head>？
 *   275KB 的脚本只有文章页才用得到，让 media-enhance.js 按需加载更省流量，
 *   而且这样在主题 PJAX 无刷新切换页面时也不会漏加载。
 */

'use strict';

const KATEX_CSS = '/vendor/katex/katex.min.css';
const ENHANCE_JS = '/js/media-enhance.js';

/**
 * 博客的 marked 开了 breaks 选项，markdown 里的换行都会被渲染成 <br>。
 * 后果是 $$...$$ 块级公式会被拆成「$$ <br> 公式 <br> $$」三个文本节点，
 * 而 KaTeX 的 auto-render 只合并相邻的文本节点，中间夹了 <br> 就认不出
 * 块级公式。所以这里把 $$ 内部的 <br> 还原成换行，让公式重新连成一片。
 * <pre> 代码块整体跳过，防止误伤里面正常出现的 $$。
 */
function normalizeMathBreaks(html) {
    return html.replace(
        /(<pre[\s\S]*?<\/pre>)|(\$\$[\s\S]*?\$\$)/gi,
        function (whole, pre, math) {
            if (pre) {
                return pre;
            }
            return math.replace(/<br\s*\/?>/gi, '\n');
        }
    );
}

hexo.extend.filter.register('after_render:html', function (str) {
    if (str.indexOf('</head>') === -1 || str.indexOf('media-enhance.js') !== -1) {
        return str;
    }
    str = normalizeMathBreaks(str);
    let head =
        '<link rel="stylesheet" href="' + KATEX_CSS + '">' +
        '<script defer src="' + ENHANCE_JS + '"></script>';
    return str.replace('</head>', head + '</head>');
});
