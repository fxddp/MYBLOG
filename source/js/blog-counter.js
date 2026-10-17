/**
 * 博客阅读量 + 点赞 —— 浏览器端
 * 安装位置：博客的 source/js/blog-counter.js
 *
 * 依赖 window.__BC_API__（由 scripts/counter-inject.js 注入）
 * 设计原则：接口挂掉就静默隐藏，绝不影响文章正文阅读
 */
(function () {
    'use strict';

    var API = window.__BC_API__ || '';
    if (!API) return;

    var ICON_EYE = 'fas fa-eye';
    var ICON_HEART = 'far fa-heart';
    var ICON_HEART_ON = 'fas fa-heart';

    function normalize(pathname) {
        var p = String(pathname || '/');
        p = p.split('#')[0].split('?')[0];
        if (p.length > 1) p = p.replace(/\/+$/, '');
        return p || '/';
    }

    function fmt(n) {
        if (typeof n !== 'number' || !isFinite(n)) return '0';
        if (n >= 10000) return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
        if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(n);
    }

    function store(type, key, value) {
        try {
            var s = type === 'session' ? window.sessionStorage : window.localStorage;
            if (value === undefined) return s.getItem(key);
            s.setItem(key, value);
        } catch (e) {
            return null;
        }
    }

    function api(method, path, body) {
        var opt = {
            method: method,
            mode: 'cors',
            credentials: 'omit',
            headers: {}
        };
        if (body) {
            opt.headers['content-type'] = 'application/json';
            opt.body = JSON.stringify(body);
        }
        return fetch(API + path, opt).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        });
    }

    function injectStyle() {
        if (document.getElementById('bc-style')) return;
        var style = document.createElement('style');
        style.id = 'bc-style';
        style.textContent =
            '.bc-item{display:inline-flex;align-items:center;gap:.35em;margin-left:1.25rem;cursor:default}' +
            '.bc-item i{font-size:.85em}' +
            '.bc-like{cursor:pointer;user-select:none;transition:color .15s}' +
            '.bc-like:hover{color:#e25555}' +
            '.bc-like.is-liked{color:#e25555;cursor:default}' +
            '.bc-like.is-liked i{animation:bc-pop .3s ease}' +
            '@keyframes bc-pop{0%{transform:scale(1)}45%{transform:scale(1.35)}100%{transform:scale(1)}}';
        document.head.appendChild(style);
    }

    function init() {
        var meta = document.querySelector('.article-meta .level-left');
        if (!meta) return;

        var path = normalize(location.pathname);
        var existing = meta.querySelector('.bc-views');
        if (existing && existing.getAttribute('data-path') === path) return;
        if (existing) {
            var old = meta.querySelectorAll('.bc-item');
            for (var i = 0; i < old.length; i++) old[i].remove();
        }

        injectStyle();

        var viewsEl = document.createElement('span');
        viewsEl.className = 'level-item bc-item bc-views';
        viewsEl.setAttribute('data-path', path);
        viewsEl.innerHTML = '<i class="' + ICON_EYE + '"></i><span class="bc-num">0</span>';

        var likeEl = document.createElement('span');
        likeEl.className = 'level-item bc-item bc-like';
        likeEl.setAttribute('role', 'button');
        likeEl.setAttribute('tabindex', '0');
        likeEl.innerHTML = '<i class="' + ICON_HEART + '"></i><span class="bc-num">0</span>';

        meta.appendChild(viewsEl);
        meta.appendChild(likeEl);

        var viewNum = viewsEl.querySelector('.bc-num');
        var likeNum = likeEl.querySelector('.bc-num');
        var liked = store('local', 'bc_l:' + path) === '1';

        function paintLiked() {
            likeEl.classList.toggle('is-liked', liked);
            likeEl.querySelector('i').className = liked ? ICON_HEART_ON : ICON_HEART;
            likeEl.setAttribute('title', liked ? '已点赞' : '点个赞');
        }

        function paint(data) {
            viewNum.textContent = fmt(data.views);
            likeNum.textContent = fmt(data.likes);
        }

        function fail() {
            viewsEl.remove();
            likeEl.remove();
        }

        paintLiked();

        // 同一次会话里重复打开同一篇不重复计数
        var seen = store('session', 'bc_v:' + path) === '1';
        var req = seen
            ? api('GET', '/api/stats?path=' + encodeURIComponent(path))
            : api('POST', '/api/view', { path: path });

        req.then(function (data) {
            store('session', 'bc_v:' + path, '1');
            paint(data);
        }).catch(fail);

        function doLike() {
            if (liked) return;
            likeEl.classList.add('is-loading');
            api('POST', '/api/like', { path: path })
                .then(function (data) {
                    liked = true;
                    store('local', 'bc_l:' + path, '1');
                    paintLiked();
                    paint(data);
                })
                .catch(function () {
                    /* 点赞失败就保持原样，不打扰读者 */
                })
                .then(function () {
                    likeEl.classList.remove('is-loading');
                });
        }

        likeEl.addEventListener('click', doLike);
        likeEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                doLike();
            }
        });
    }

    if (!window.__bcBound) {
        window.__bcBound = true;
        document.addEventListener('pjax:complete', init);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
