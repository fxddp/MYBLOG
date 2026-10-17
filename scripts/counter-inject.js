/**
 * Hexo 注入脚本：给每篇文章的元信息栏加上「阅读量 + 点赞」
 *
 * 安装位置：博客根目录的 scripts/ 文件夹（没有就新建一个）
 * Hexo 会自动加载根目录 scripts/*.js，不需要在 package.json 里注册
 *
 * 只需要改下面这一行：把地址换成你部署后的 Worker 地址
 */

'use strict';

// ！！！改这里！！！部署完成后 wrangler 会打印类似 https://blog-counter.xxx.workers.dev
const COUNTER_API = 'https://blog-counter.你的子域.workers.dev';

hexo.extend.filter.register('after_render:html', function (str, data) {
    // 还没填真实地址时直接跳过，避免线上页面去请求一个不存在的域名
    if (!COUNTER_API || COUNTER_API.indexOf('你的子域') !== -1) {
        return str;
    }

    // 只在文章详情页注入：Hexo 会把文章页的 layout 标记成 post
    // 首页、归档、分类、标签、独立页面都不会被注入
    const page = data && data.page;
    const isPost = !!page && (page.layout === 'post' || !!page.__post);
    if (!isPost) {
        return str;
    }
    if (str.indexOf('blog-counter.js') !== -1) {
        return str;
    }

    // 放在 .columns 内部，这样 pjax 切换页面时脚本会被重新执行，计数不会停在上一页
    const tag =
        '<script>window.__BC_API__=' + JSON.stringify(COUNTER_API) + ';</script>' +
        '<script data-pjax src="/js/blog-counter.js"></script>';

    return str.replace('<div class="columns">', '<div class="columns">' + tag);
});
