/**
 * 给正文图片加懒加载
 *
 * 图多的文章（比如二十张照片那种）如果不加 loading="lazy"，
 * 打开页面会把几十张图一次性全拉下来。这里统一补上。
 */
hexo.extend.filter.register('after_render:html', function (str) {
  // 已经有 loading 属性的不动
  return str.replace(/<img(?![^>]*\bloading=)/gi,
    '<img loading="lazy" decoding="async"');
});
