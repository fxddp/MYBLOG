# -*- coding: utf-8 -*-
"""
生成《数学函数发展史》一文的四张配图。

尺寸原则：文章正文列宽约 700px，所以所有图都按 6.4in x 110dpi = 704px 出图，
让浏览器基本 1:1 显示，图内文字不会被缩放到看不清。

用法：
    python tools/gen-math-figs.py
输出：
    source/img/math/{timeline,conics,fourier,weierstrass}.png
"""
import os
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "source", "img", "math")
os.makedirs(OUT, exist_ok=True)

# ---- 字体：优先微软雅黑，保证中文不出方块 ----
for name in ["Microsoft YaHei", "SimHei", "Noto Sans CJK SC", "Source Han Sans SC"]:
    if any(name == f.name for f in font_manager.fontManager.ttflist):
        plt.rcParams["font.family"] = name
        break
plt.rcParams["axes.unicode_minus"] = False

INK = "#1f2430"      # 主文字
MUTED = "#8b93a1"    # 次要文字
LINE = "#c9cfda"     # 辅助线
BLUE = "#3d5a86"     # 主色
ACCENT = "#c9772f"   # 强调色


def save(fig, name):
    path = os.path.join(OUT, name)
    fig.savefig(path, dpi=120, bbox_inches="tight", pad_inches=0.05,
                facecolor="white")
    plt.close(fig)

    # 裁掉多余白边，让图片尺寸贴近内容，在正文里不会被缩得太小
    from PIL import Image, ImageChops
    im = Image.open(path).convert("RGB")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bbox = ImageChops.difference(im, bg).getbbox()
    if bbox:
        pad = 8
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(im.width, bbox[2] + pad)
        bottom = min(im.height, bbox[3] + pad)
        im.crop((left, top, right, bottom)).save(path, optimize=True)
    print("saved", path, Image.open(path).size)


# ---------------------------------------------------------------- 1. 时间线
def timeline():
    events = [
        ("1673", "莱布尼茨", "首次使用 functio 指代随曲线变化的量"),
        ("1694", "伯努利", "把函数解释为「由变量与常数组成的解析表达式」"),
        ("1734", "欧拉", "引入 f(x) 记号，区分法则与函数值"),
        ("1822", "傅里叶", "三角级数展开，函数不必是公式"),
        ("1837", "狄利克雷", "现代定义：对应关系，无关表达方式"),
        ("1872", "魏尔斯特拉斯", "构造处处连续、处处不可导的函数"),
    ]

    fig, ax = plt.subplots(figsize=(5.6, 2.7))
    ax.set_xlim(0.5, 9.4)
    ax.set_ylim(0, 6.4)
    ax.axis("off")

    x_year, x_line, x_name, x_desc = 0.92, 1.06, 1.24, 3.5
    top = 5.95
    gap = 1.05

    ax.plot([x_line, x_line], [top - gap * 5, top],
            color=LINE, lw=1.4, zorder=1, solid_capstyle="round")

    for i, (year, who, what) in enumerate(events):
        y = top - gap * i
        ax.scatter([x_line], [y], s=46, color="white", edgecolor=BLUE,
                   linewidth=1.6, zorder=3)
        ax.scatter([x_line], [y], s=9, color=BLUE, zorder=4)

        ax.text(x_year, y, year, ha="right", va="center",
                fontsize=9.5, color=ACCENT, fontweight="bold")
        ax.text(x_name, y, who, ha="left", va="center",
                fontsize=9.5, color=INK, fontweight="bold")
        ax.text(x_desc, y, what, ha="left", va="center",
                fontsize=8.4, color=MUTED)

    save(fig, "timeline.png")


# ---------------------------------------------------------------- 2. 圆锥曲线
def conics():
    fig, axes = plt.subplots(1, 3, figsize=(6.4, 1.95))

    t = np.linspace(-3.2, 3.2, 600)

    # 抛物线 y = x^2 / 4
    axes[0].plot(t, t ** 2 / 4, color=BLUE, lw=1.8)

    # 椭圆
    th = np.linspace(0, 2 * np.pi, 400)
    axes[1].plot(2.4 * np.cos(th), 1.5 * np.sin(th), color=BLUE, lw=1.8)

    # 双曲线 x^2/4 - y^2/1.5 = 1
    for s in (-1, 1):
        axes[2].plot(s * 2 * np.cosh(t), 1.5 * np.sinh(t), color=BLUE, lw=1.8)

    for ax, title in zip(axes, ["抛物线", "椭圆", "双曲线"]):
        ax.axhline(0, color=LINE, lw=0.8, zorder=0)
        ax.axvline(0, color=LINE, lw=0.8, zorder=0)
        ax.set_title(title, fontsize=9.5, color=INK, pad=5)
        ax.set_xlim(-3, 3)
        ax.set_ylim(-2.2, 2.2)
        ax.set_xticks([])
        ax.set_yticks([])
        for side in ("top", "right", "left", "bottom"):
            ax.spines[side].set_visible(False)

    fig.subplots_adjust(wspace=0.12)
    save(fig, "conics.png")


# ---------------------------------------------------------------- 3. 傅里叶
def fourier():
    x = np.linspace(-2 * np.pi, 2 * np.pi, 2000)

    def square(x):
        return np.where(np.sin(x) >= 0, 1.0, -1.0)

    fig, ax = plt.subplots(figsize=(6.4, 2.75))

    ax.plot(x, square(x), color=MUTED, lw=1.0, ls=(0, (4, 3)),
            label="方波（目标）", zorder=2)

    for n, color, lw in [(1, "#b8c6dc", 1.2), (3, "#7d99c2", 1.4), (5, BLUE, 1.8)]:
        s = np.zeros_like(x)
        for k in range(1, n + 1, 2):
            s += (4 / (np.pi * k)) * np.sin(k * x)
        ax.plot(x, s, color=color, lw=lw, label=f"{n} 项叠加", zorder=3)

    ax.axhline(0, color=LINE, lw=0.7, zorder=1)
    ax.set_xlim(-2 * np.pi, 2 * np.pi)
    ax.set_ylim(-1.75, 1.75)
    ax.set_xticks([-2 * np.pi, -np.pi, 0, np.pi, 2 * np.pi])
    ax.set_xticklabels(["-2π", "-π", "0", "π", "2π"], fontsize=8.5, color=MUTED)
    ax.set_yticks([-1.5, -1, -0.5, 0, 0.5, 1, 1.5])
    ax.set_yticklabels(["-1.5", "-1.0", "-0.5", "0.0", "0.5", "1.0", "1.5"],
                       fontsize=8.5, color=MUTED)
    ax.set_xlabel("x", fontsize=9, color=MUTED, labelpad=2)
    ax.tick_params(length=3, color=LINE)

    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color(LINE)
        ax.spines[side].set_linewidth(0.8)

    ax.legend(loc="upper center", bbox_to_anchor=(0.5, -0.22), ncol=4,
              frameon=False, fontsize=8.5, handlelength=1.6, columnspacing=1.4)

    save(fig, "fourier.png")


# ---------------------------------------------------------------- 4. 魏尔斯特拉斯
def weierstrass():
    def W(x, n, a=0.5, b=3.0):
        out = np.zeros_like(x)
        for k in range(n):
            out += a ** k * np.cos(np.pi * b ** k * x)
        return out

    x = np.linspace(-1, 1, 6000)
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 2.75), sharex=True)

    for ax, n, color in [(axes[0], 3, "#7d99c2"), (axes[1], 12, BLUE)]:
        ax.plot(x, W(x, n), color=color, lw=1.0)
        ax.set_ylabel(f"前 {n} 项", fontsize=9, color=INK, labelpad=6)
        ax.set_yticks([])
        for side in ("top", "right", "left"):
            ax.spines[side].set_visible(False)
        ax.spines["bottom"].set_color(LINE)
        ax.spines["bottom"].set_linewidth(0.8)
        ax.tick_params(axis="x", labelsize=8.5, colors=MUTED, length=3)
        ax.set_xlim(-1, 1)

    axes[1].set_xlabel("x", fontsize=9, color=MUTED, labelpad=2)
    fig.subplots_adjust(hspace=0.28)

    save(fig, "weierstrass.png")


if __name__ == "__main__":
    timeline()
    conics()
    fourier()
    weierstrass()
