/**
 * 给头像地址加内容版本号
 *
 * GitHub Pages 对静态资源的缓存策略是 Cache-Control: max-age=600。
 * 换头像时文件名不变（都是 /img/avatar.jpg），浏览器在 10 分钟内会直接用
 * 本地缓存，看起来就像"头像没改"。
 *
 * 这里按文件内容算一个短哈希拼到 URL 后面：图片一改，URL 就变，
 * 浏览器必须重新下载；图片没改则哈希不变，缓存照常命中。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const AVATAR_REL = 'source/img/avatar.jpg';
const AVATAR_URL = '/img/avatar.jpg';

function avatarVersion() {
  try {
    const file = path.join(hexo.base_dir, AVATAR_REL);
    const buf = fs.readFileSync(file);
    return crypto.createHash('md5').update(buf).digest('hex').slice(0, 8);
  } catch (e) {
    return null;
  }
}

hexo.extend.filter.register('after_render:html', function (str) {
  if (str.indexOf(AVATAR_URL) === -1) return str;
  const v = avatarVersion();
  if (!v) return str;
  // 已经带查询串的不重复加
  return str.replace(
    new RegExp(AVATAR_URL.replace(/\./g, '\\.') + '(?![?\\w])', 'g'),
    AVATAR_URL + '?v=' + v
  );
});
