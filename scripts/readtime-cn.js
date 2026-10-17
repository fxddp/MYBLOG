/**
 * 修正中文阅读时长
 *
 * Icarus 主题把阅读速度硬编码为 150 词/分钟（见 layout/common/article.jsx）。
 * 这个速度是为英文单词设计的，套在中文上会严重高估：
 * 一篇 2000 字的中文文章会被标成「16 分钟读完」，实际只要 5 分钟左右。
 *
 * 这里在渲染后把时长按中文阅读速度（400 字/分钟）重算一遍。
 * 只改数字，不改结构，也不影响英文页面以外的任何逻辑。
 */
const CHARS_PER_MINUTE = 400;

hexo.extend.filter.register('after_render:html', function (str) {
  // 匹配形如「16 分钟读完 (大约2343个字)」，括号可能是半角也可能是全角
  return str.replace(
    /(\d+)\s*分钟读完\s*[（(]大约\s*(\d+)\s*个字[）)]/g,
    function (match, _minutes, words) {
      const count = parseInt(words, 10);
      if (!count) return match;
      const minutes = Math.max(1, Math.round(count / CHARS_PER_MINUTE));
      return minutes + ' 分钟读完 (大约' + count + '个字)';
    }
  );
});
