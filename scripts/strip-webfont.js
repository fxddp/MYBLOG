/**
 * 去掉 Google Fonts / 镜像站的 webfont 外链
 *
 * 原因：
 * 1. 主题生成的字体 URL 没有带 &display=swap，字体加载期间文字不可见（FOIT），
 *    慢网络下正文和代码块会空白 1~3 秒。
 * 2. 正文已经在 source/css/custom.css 里改用系统字体栈，代码块用 monospace
 *    （Windows 上是 Consolas），不依赖外网字体反而更快更稳。
 *
 * 效果：页面不再请求 fonts.*，也就没有 FOIT。
 * 如果以后想重新用 webfont，把 _config.icarus.yml 的 providers.fontcdn 调好后
 * 删掉这个文件即可。
 */
hexo.extend.filter.register('after_render:html', function (str) {
    return str.replace(
        /<link[^>]*href="https?:\/\/fonts\.[^"]*"[^>]*>/gi,
        ''
    );
});
