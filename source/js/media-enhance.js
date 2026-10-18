/*!
 * 鸟的博客 · 媒体增强（source/js/media-enhance.js）
 *
 * 作用一：把正文里的 <video> / <audio> / <model-viewer> 包一层自适应容器，
 *         让宽视频、3D 模型在手机上也正常显示。
 * 作用二：按需加载 KaTeX，把文章里的 $$...$$、$...$、\(...\)、\[...\]
 *         渲染成公式。资源在 source/vendor/ 下，跟站点一起部署，不依赖外网 CDN。
 *
 * 兼容问题：
 *   主题开了 PJAX，站内跳转不刷新整个页面，只替换 .columns 里的内容，
 *   所以这里用 MutationObserver 监听文档变化，内容换掉就自动重跑一遍。
 *   处理时会先断开 observer，避免自己的 DOM 改动又触发一次死循环。
 *
 * 作者只要正常写 Markdown，无需任何额外操作：
 *   <video src="/videos/demo.mp4" controls></video>
 *   <audio src="/audio/bgm.mp3" controls></audio>
 *   <model-viewer src="/models/robot.glb" camera-controls auto-rotate></model-viewer>
 */
(function () {
    'use strict';

    var KATEX_JS = '/vendor/katex/katex.min.js';
    var AUTORENDER_JS = '/vendor/katex/auto-render.min.js';
    var MODEL_VIEWER_JS = '/vendor/model-viewer/model-viewer.min.js';

    var DELIMITERS = [
        { left: '$$', right: '$$', display: true },
        { left: '\\begin{equation}', right: '\\end{equation}', display: true },
        { left: '\\begin{align}', right: '\\end{align}', display: true },
        { left: '\\begin{gather}', right: '\\end{gather}', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false }
    ];

    var IGNORED_TAGS = ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option'];

    var observer = null;
    var katexPromise = null;
    var modelViewerPromise = null;

    /* ---------------------------------------------------------- 工具 */

    function loadScript(src, asModule) {
        return new Promise(function (resolve, reject) {
            var el = document.createElement('script');
            if (asModule) {
                el.type = 'module';
            }
            el.src = src;
            el.onload = function () { resolve(); };
            el.onerror = function () { reject(new Error('无法加载 ' + src)); };
            document.head.appendChild(el);
        });
    }

    function ensureKatex() {
        if (window.katex && window.renderMathInElement) {
            return Promise.resolve();
        }
        if (!katexPromise) {
            katexPromise = loadScript(KATEX_JS)
                .then(function () { return loadScript(AUTORENDER_JS); })
                .catch(function (err) {
                    katexPromise = null; // 失败不清掉，下次重试
                    console.warn(err);
                });
        }
        return katexPromise;
    }

    function ensureModelViewer() {
        if (document.querySelector('script[data-mv]')) {
            return modelViewerPromise || Promise.resolve();
        }
        if (!modelViewerPromise) {
            // model-viewer 3.x 官方只提供 ES Module 构建，必须按模块加载
            modelViewerPromise = loadScript(MODEL_VIEWER_JS, true)
                .then(function () {
                    var tag = document.createElement('script');
                    tag.setAttribute('data-mv', '');
                    tag.textContent = '/* model-viewer 已加载 */';
                    document.head.appendChild(tag);
                })
                .catch(function (err) {
                    modelViewerPromise = null;
                    console.warn(err);
                });
        }
        return modelViewerPromise;
    }

    /* ------------------------------------------------- 正文容器定位 */

    function articleRoots() {
        var list = document.querySelectorAll('.article .content');
        if (!list.length) {
            list = document.querySelectorAll('.content');
        }
        return list;
    }

    /* ------------------------------------------------------ 媒体包装 */

    // 自定义元素（model-viewer）的 tagName 会被浏览器转成大写，类名单独映射
    var BOX_CLASS = {
        VIDEO: 'media-embed is-video',
        AUDIO: 'media-embed is-audio',
        'MODEL-VIEWER': 'media-embed is-model',
    };

    function wrapMedia() {
        var roots = articleRoots();
        for (var i = 0; i < roots.length; i++) {
            var nodes = roots[i].querySelectorAll('video, audio, model-viewer');
            for (var j = 0; j < nodes.length; j++) {
                var el = nodes[j];
                var parent = el.parentNode;
                if (!parent || parent.classList.contains('media-embed')) {
                    continue;
                }
                var box = document.createElement('div');
                box.className = BOX_CLASS[el.tagName] || 'media-embed';
                parent.insertBefore(box, el);
                box.appendChild(el);

                if (el.tagName === 'MODEL-VIEWER') {
                    ensureModelViewer();
                }
            }
        }
    }

    /* ------------------------------------------------------ 公式渲染 */

    function renderMath() {
        var roots = articleRoots();
        if (!roots.length) {
            return;
        }
        // 先粗筛一下有没有美元符号，没有就直接跳过，不白加载 270KB 的 KaTeX
        var hasMath = false;
        for (var i = 0; i < roots.length && !hasMath; i++) {
            var text = roots[i].textContent || '';
            if (text.indexOf('$') !== -1 || text.indexOf('\\(') !== -1 ||
                text.indexOf('\\[') !== -1 || text.indexOf('\\begin') !== -1) {
                hasMath = true;
            }
        }
        if (!hasMath) {
            return;
        }
        ensureKatex().then(function () {
            if (!window.renderMathInElement) {
                return;
            }
            for (var i = 0; i < roots.length; i++) {
                window.renderMathInElement(roots[i], {
                    delimiters: DELIMITERS,
                    ignoredTags: IGNORED_TAGS,
                    // 已经渲染过的公式不再进队列，重复执行也安全
                    ignoredClasses: ['no-math', 'katex'],
                    // 解析失败的公式（比如正文里当成金额写的 $100）保留原文
                    throwOnError: false
                });
            }
        });
    }

    /* ------------------------------------------------------------ 主流程 */

    function enhance() {
        if (observer) {
            observer.disconnect();
        }
        try {
            wrapMedia();
            renderMath();
        } finally {
            if (observer) {
                observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                });
            }
        }
    }

    function boot() {
        enhance();
        // 主题 PJAX 会整块替换 .columns，老节点上的监听会失效，
        // 所以在 documentElement 上挂一个常驻监听，换内容就重跑。
        if (window.MutationObserver && !observer) {
            var timer = null;
            observer = new MutationObserver(function () {
                if (timer) {
                    return;
                }
                timer = setTimeout(function () {
                    timer = null;
                    enhance();
                }, 150);
            });
            observer.observe(document.documentElement, { childList: true, subtree: true });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})();
