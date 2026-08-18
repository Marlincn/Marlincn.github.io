# Marlin-web — 个人网站

一个以「深夜幕蓝 + 玫瑰星系粒子」为视觉核心的个人网站,基于 Marlin(mikejosion.github.io)的静态构建产物重建,采用 Hexo 8.1.2 + Butterfly 5.7.0 + 自研 rose-galaxy 定制层。

| 深色主题 | 浅色主题 |
| --- | --- |
| ![深色主题预览](docs/preview-dark.png) | ![浅色主题预览](docs/preview-light.png) |

---

## 目录

- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [写一篇文章(完整实例)](#写一篇文章完整实例)
- [各版块逻辑](#各版块逻辑)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [定制记录](#定制记录文件级)
- [构建过程记录](#构建过程记录)
- [后续计划(Phase 2)](#后续计划phase-2)

---

## 功能特性

- 深色 / 浅色双主题:时间自动切换(7:00-17:59 浅色、18:00-6:59 深色),任意页手动切换写入 localStorage 偏好、切页保持、到时间边界拉回,粒子与背景全联动换肤
- 玫瑰星系粒子画布:尘埃 / 雾气 / 花瓣三类粒子 + 星座连线 + 鼠标吸引,30fps 节流,`prefers-reduced-motion` 降级
- Hero 打字机副标题、滚动显现动画、LATEST SIGNAL 最新文章卡
- 全站本地搜索(search.xml,无后端)、PJAX 无刷新导航、访问统计(busuanzi)
- 9 篇文章(Markdown 写作工作流)+ 文章 / 音乐 / 说说 / 关于 页面;导航:首页 / 文章 / 音乐 / 说说 / 关于
- Hero 背景图:深色主题 `night.webp`、浅色主题 `day.webp`(webp 压缩,质量 95)
- 已移除:鼠标点击粒子迸发、点击浮字、玫瑰绽放花瓣彩蛋、小王子彩蛋、归档/分类/模板/照片板块(见定制记录)

---

## 快速开始

```bash
npm install          # 首次安装依赖
npm run server       # 本地预览 http://localhost:4000
npm run build        # 生成 public/(含文章、标签、搜索索引、feed)
npm run clean        # 清理 public/ 与缓存
npm run deploy       # 部署(需先在 _config.yml 配置 deploy.repo)
```

---

## 写一篇文章(完整实例)

**1. 在 `source/_posts/` 新建 md 文件**,例如 `source/_posts/Markdown 入门指南.md`:

````markdown
---
title: Markdown 入门指南
date: 2026-08-17 00:00:00
tags:
  - Markdown语法
---

# Markdown 入门指南

Markdown 概述、工作原理以及用途。

## Markdown 是什么？

Markdown 是一种轻量级的标记语言……

```go
fmt.Println("代码块示例")
```
````

字段说明:

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 是 | 文章标题,显示在页面、卡片、feed |
| `date` | 是 | 发布日期,决定文章 URL(`/2026/08/17/标题/`)与排序 |
| `tags` | 否 | 标签列表,决定归属的标签页(见下) |

**2. 构建:**

```bash
hexo clean && hexo generate
```

**3. 自动完成:**

- 文章页生成:`/2026/08/17/Markdown 入门指南/`
- 文章页出现标签链接 → `/articles/Markdown语法/`
- 标签页自动更新(已存在则计数 +1;新标签自动建页)
- `/articles/` 索引、`search.xml`、`sitemap.xml`、`atom.xml` 同步更新

**4. 首页同步(唯一的手工步骤):** 首页的 LATEST SIGNAL 与"精选记录"卡片是静态的,新文章上线后按[首页更新实例](#首页)手动同步。

---

## 各版块逻辑

### 文章系统(Hexo 渲染)

- 文章源:`source/_posts/*.md`,由 Hexo 渲染为 `/YYYY/MM/DD/标题/`
- 写作流程见上方[完整实例](#写一篇文章完整实例)
- 文章页的标签链接由 Hexo 按 `tag_dir`(已配置为 `articles`)自动生成

### 标签系统(自动生成,非静态维护)

**工作原理:**

```
_posts/*.md 的 front matter tags
        ↓ hexo clean && generate
scripts/nova-tags.js 生成器
        ↓
/articles/index.html        标签索引(卡片 + 统计)
/articles/<标签>/index.html 每个标签页(hero/统计/文章卡片/相关标签/阅读顺序/侧边栏)
```

- 模板:`nova-templates/tag-template.html`(标签页)、`index-template.html`(索引页),占位符版,源自原站 nova-tag 定制样式
- 数据自动派生:

| 数据 | 来源 |
| --- | --- |
| 卡片摘要 | front matter `description`,否则正文首段(去 Markdown 符号,截 90 字) |
| 卡片封面 | 按文章标签推断:Go→tech-go、MySQL/sql 系→tech-mysql、算法/链表/栈系→tech-algorithm、其他→tech-notes |
| 统计 / 相关标签 / 阅读顺序 | 全自动计算 |

**加一个新标签的完整流程**(以给文章加标签 `AI` 为例):

```markdown
---
title: LM Studio 接入 OpenCode 指南
date: 2026-08-17 00:00:00
tags:
  - AI          # ← 加这一行
---
```

然后 `hexo clean && hexo generate`,`/articles/AI/` 自动出现,零手工。

### 搜索 / sitemap / atom(生成器输出)

- 同一生成器输出三个文件(构建时自动):

| 文件 | 内容 | 用途 |
| --- | --- | --- |
| `search.xml` | 全部文章纯文本全文索引 | 站内本地搜索 |
| `sitemap.xml` | 文章 URL + 更新日期 | SEO |
| `atom.xml` | RSS/Atom feed | 订阅 |

- `hexo-generator-feed` 已卸载,由生成器统一输出,避免重复
- 搜索命中逻辑:索引 = 渲染后的纯文本(代码块 `figure.highlight`/`pre` 与内联 `<code>` 已剔除,源码不参与匹配);摘要从**命中位置附近**截取(约 120 字符),对话框内两行截断——命中位置只会落在渲染文字上,摘要永不显示源码

### 首页

- 静态 HTML(`source/index.html`),**两处需要手工维护**:

**a. LATEST SIGNAL**(hero 内最新文章卡):

```html
<a class="nova-latest-signal" href="/2026/08/17/Markdown%20%E5%85%A5%E9%97%A8%E6%8C%87%E5%8D%97/" aria-label="最新文章：Markdown 入门指南，发布于 2026-08-17">
  <span>LATEST SIGNAL</span><strong>Markdown 入门指南</strong><time>2026-08-17</time>
</a>
```

**b. 精选记录**(`nova-featured-grid` 内的 `nova-note-card`,9 张卡片):

```html
<div class="nova-note-card nova-note-card--lead" data-href="/2026/08/17/..." role="link" tabindex="0" aria-label="阅读文章：标题">
  <div class="post_cover">
    <a href="/2026/08/17/..." title="标题">
      <img class="post-bg" src="/img/covers/tech-notes.webp" onerror="this.onerror=null;this.src='/img/404.jpg'" alt="标题" loading="lazy" decoding="async" width="1200" height="900">
    </a>
  </div>
  <div class="recent-post-info">
    <a class="article-title" href="/2026/08/17/..." title="标题">标题</a>
    <div class="article-meta-wrap">
      <span class="post-meta-date"><i class="far fa-calendar-alt"></i><span class="article-meta-label">发表于</span><time datetime="2026-08-17T00:00:00.000Z">2026-08-17</time></span>
      <span class="article-meta"><span class="article-meta-separator">|</span><i class="fas fa-inbox"></i><span class="article-meta__categories">标签名</span></span>
    </div>
    <div class="content">文章摘要</div>
  </div>
</div>
```

- 第一张卡片用 `nova-note-card--lead`,其余用 `--side`;URL 中空格需编码为 `%20`
- 生活碎片区指向 /music/、/shuoshuo/,与文章无关

### 主题切换

- **时间自动制**:7:00-17:59 浅色、18:00-6:59 深色(访客本地时间,定时器精确排到边界原地切换,无需刷新)
- **手动切换**(任意页 `#darkmode` 按钮):写入 localStorage 偏好(`marlin-theme-pref`),切页/刷新保持;到下一时间边界自动清除并拉回时间制
- 无偏好新访客:纯时间制
- 实现:`source/rose-galaxy/js/nova-ux.js`(时间主题模块)

### 导航栏

- 除首页外全局统一(以音乐页为基准,`custom.css` 中 `body:not(.nova-home-active)` 规则):

| 状态 | 样式 |
| --- | --- |
| 高度 | 68px |
| 未滚动(深浅) | 全透明,透出各页 hero |
| 浅色滚动后 | 保持全透明(light 分支特异性高于滚动条规则) |
| 深色滚动后 | 深色毛玻璃条 rgba(7,10,20,.72) + blur(18px) |
| 菜单文字 / 站点名 / 搜索按钮 | 跟随主题统一 |

- 首页(nova-home-active)悬浮透明导航独立

### 页面板块

| 路径 | 内容 | 样式文件 |
| --- | --- | --- |
| `/` | 首页 | `rose-galaxy/css/nova-home.css` |
| `/articles/` | 文章标签索引(生成器) | `tag-page.css` |
| `/articles/<标签>/` | 标签页(生成器) | `tag-page.css` |
| `/music/` | 音乐播放 | `music-page.css` |
| `/shuoshuo/` | 说说 | `shuoshuo-page.css` |
| `/about/` | 关于 | `about-page.css` |
| `/courses/` | 课程(Phase 2 骨架) | — |
| `/404.html` | 404 | Butterfly 默认 |

---

## 项目结构

```
Marlin-web/
├── _config.yml              Hexo 站点配置
├── _config.butterfly.yml    Butterfly 主题配置(导航/搜索/注入)
├── package.json             Hexo 8.1.2 + 插件 + hexo-cli
├── scripts/
│   └── nova-tags.js         ★ 生成器:标签页/索引/搜索/sitemap/atom
├── nova-templates/          ★ 生成器模板(tag-template / index-template)
├── source/                  网站源文件
│   ├── index.html           首页(静态;LATEST SIGNAL + 精选记录手工维护)
│   ├── _posts/              9 篇文章 Markdown(front matter: title/date/tags)
│   ├── css/ js/ img/        Butterfly 基座资源 + 站点图片(day.webp / night.webp)
│   ├── rose-galaxy/         ★ nova 定制层(css / js / fonts / img)
│   ├── music/ about/ shuoshuo/ courses/ 404.html
│   └── robots.txt           (search/sitemap/atom 由生成器输出,不在 source)
├── themes/butterfly         Butterfly 主题(由 node_modules 复制,source 已清空防冲突)
└── docs/                    预览截图
```

---

## 技术栈

| 层 | 选型 |
| --- | --- |
| 静态生成 | Hexo 8.1.2(Node.js 24) |
| 主题基座 | Butterfly 5.7.0(布局 / 侧边栏 / 搜索对话框 / pjax) |
| 定制层 | rose-galaxy(nova 体系:首页特效、各页面样式、UX 脚本) |
| 资源 | 字体自托管(woff2);Font Awesome / pjax / busuanzi 走 CDN |
| 部署目标 | GitHub Pages(根路径) |

---

## 定制记录(文件级)

> 最新在上;完整历史见下方构建过程记录。

| 日期 | 改动 | 涉及文件 |
| --- | --- | --- |
| 2026-08-18 | 音乐页换源:B 站收藏夹"music"(UID 3546712446601247,公开)经腾讯云函数读取,播放器改原生 Audio + stream2 拉流;移除 Meting/网易云/APlayer 依赖 | `music-page.js`、`music/index.html` |
| 2026-08-17 | 浅色模式导航栏静止(未滚动)文字改为深色模式同款白色(菜单/站点名 rgba(255,255,255,.7)、搜索 #f2edf0),滚动后浅色毛玻璃不受影响 | `custom.css` |
| 2026-08-17 | 文章页统一背景图:`default_top_img = /img/leetcode.webp`(marlin 参考站 go语法总结 同款,同位置:header 400px / center-cover / 暗色遮罩),9 篇全部生效 | `_config.butterfly.yml` |
| 2026-08-17 | 搜索索引剔除代码:代码块(`figure.highlight`/`pre`)与内联 `<code>` 不参与匹配,摘要只显示渲染文字;绘世提示词示例改为代码块展示 | `nova-tags.js`、`_posts/绘世-Stable Diffusion.md` |
| 2026-08-17 | 搜索摘要改为从正文开头截取(非命中位置),只显示渲染文字,无源码;删除正文 `[TOC]` 字面量;摘要两行截断 | `local-search.js`、`custom.css`、`_posts/` |
| 2026-08-17 | 内容换源:marlin 文章全部删除,替换为 `research/MD` 9 篇(标签:Markdown语法×5/AI/AI绘画/工具/杂记);首页 LATEST 与精选记录改为新文章 | `_posts/`、`index.html` |
| 2026-08-17 | 标签系统自动化:新增 hexo 生成器 + 模板,替代手工静态标签页;同时输出 search/sitemap/atom;卸载 hexo-generator-feed | `scripts/nova-tags.js`、`nova-templates/`、`package.json` |
| 2026-08-17 | 删除首页 footer 返回顶部箭头,伪元素占位恢复三列布局 | `index.html`、`nova-home.css` |
| 2026-08-17 | 主题切换 2.B:任意页手动切换 + localStorage 偏好保持,边界拉回 | `nova-ux.js` |
| 2026-08-17 | 导航栏全局模板(方案 C):除首页外统一,双主题透明 + 深色滚动毛玻璃 | `custom.css` |
| 2026-08-17 | 修复 /articles/ 17 页布局 bug(nav 多余 `</div>` 致 body-wrap 提前闭合) | `source/articles/` |
| 2026-08-17 | `/tags/` → `/articles/` 全站 URL 迁移 + 旧导航残留清理 | 全站 |
| 2026-08-16 | 站点 build 化:23 篇 HTML 反推 md;标签系统 build 化尝试后回退静态页 | `_posts/`、`tools/` |
| 2026-08-16 | 导航/搜索按钮尺寸系列调整(最终:图标 16px、文字 14px) | `custom.css` |
| 2026-08-16 | 时间自动主题(方案 B):删除 localStorage 记忆,纯时间制(后被 2.B 取代) | `nova-ux.js` |
| 2026-08-16 | 浅色 Hero 蓝色轻纱蒙版(状态 B)、SCROLL 滚动引导、首页模块删减 | `nova-home.css` |
| 2026-08-15 | 板块删减(归档/分类/模板/照片)、导航改版、彩蛋移除、背景图 day/night.webp | 全站 |
| 2026-08-17 | 工程更名 deymo-web → Marlin-web(目录与 package.json,含主题存储键 marlin-theme-pref) | `package.json`、`nova-ux.js`、README |

---

## 构建过程记录

> 完整历史日志:1. 调研与素材获取 → 9. 板块删减与导航改版(2026-08-15 全部步骤),以及上方定制记录表中 2026-08-16/17 的详细条目。关键踩坑:

- **hexo server 不热加载配置/模板/插件**:每次改动配置或脚本后必须重启 server
- **浏览器缓存**:CSS/JS 版本号未变时,强刷(Ctrl+Shift+R)或隐私窗口验证
- **hexo 会加载 `scripts/` 下所有文件**:模板不能放 scripts/ 下,放工程根 `nova-templates/`
- **hexo generate 不删除孤儿文件**:删除文章/页面后需 `hexo clean` 再 generate
- **headless 截图陷阱**:虚拟时钟会冻结入场动画、缓存旧 CSS,验证用全新 profile + 像素采样

---

## 后续计划(Phase 2)

1. 课程页:`/courses/` 三列卡片布局(骨架已生成,待写样式与真实内容)。
2. ~~文章反推:23 篇文章 HTML → Markdown。~~(已于 2026-08-16 完成)
3. 品牌替换:标题、作者、头像、页脚、配色变量(等待品牌名确定)。
4. 部署:配置 `_config.yml` 的 `deploy.repo` 后 `npm run deploy` 推送 GitHub Pages。
