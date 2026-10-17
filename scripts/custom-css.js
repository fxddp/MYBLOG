/**
 * 把 source/css/custom.css 注入到每个页面的 <head>
 *
 * Hexo 会把 source/ 下的文件原样复制到站点根目录，
 * 所以 source/css/custom.css 对应线上的 /css/custom.css，
 * 但主题不会自动引用它，需要在这里补一个 <link>。
 */

'use strict';

const CUSTOM_CSS = '/css/custom.css';

hexo.extend.filter.register('after_render:html', function (str) {
    if (str.indexOf(CUSTOM_CSS) !== -1) {
        return str;
    }
    if (str.indexOf('</head>') === -1) {
        return str;
    }
    return str.replace(
        '</head>',
        '<link rel="stylesheet" href="' + CUSTOM_CSS + '"></head>'
    );
});
