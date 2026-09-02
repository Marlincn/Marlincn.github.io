# Marlin-web 维护文档

> 面向维护者的内部文档：架构实现、目录职责、Hexo 工程坑、构建部署流程。
> 「怎么用/怎么写内容」请看同目录 `README.md`；重构问题清单与分期台账在本地 `C:\Users\mabin\Desktop\data\STRUCTURE-REFACTOR.md`（不入 git）。

---

## 目录

- [架构总览](#架构总览)
- [目录职责详解](#目录职责详解)
- [配置图鉴](#配置图鉴)
- [样式规范](#样式规范)
- [构建与部署](#构建与部署)
- [发布审批规则](#发布审批规则)
- [Hexo 工程坑(务必阅读)](#hexo-工程坑务必阅读)
- [常见任务](#常见任务)
- [排障清单](#排障清单)

---

## 架构总览

```
hexo 加载 scripts/*.js(插件/生成器) + themes/butterfly/layout/*.pug(模板)
        └─ 生成器组装 body: parts-common 组件 + 各页 *-parts 纯页级内容
              └─ pug 输出 shellTop/shellBottom -> 完整页面
```

| 页面类型 | 组装者 | 页级内容来源 | 模板 |
| --- | --- | --- | --- |
| 静态页(音乐/瞬间/关于/404) | `page-generator.js`(composeShell) | `page-parts/{name}.html`(纯 main 内容) | 各页面 pug |
| 首页 | `home-generator.js` | `home-parts/{top,mid,bottom}.html` + `page-scripts.html` | `home.pug` |
| 文章索引/标签 | `nova-tags.js` | `idx-parts/top.html`、`tag-parts/{top,bottom}.html` | `tags-index.pug`/`tag.pug` |
| 工程列表/详情 | `projects-generator.js` | `project-parts/top.html` | `projects.pug`/`project-detail.pug` |
| 文章详情 | Hexo 原生 post 渲染 | — | Butterfly 原版 `includes/` 链 |

**公共壳要点**（`scripts/parts-common.js`）：

- `composeShellTop({pageClass, headerCls, headerStyle, siteData, pre, closeHeader})` → loading + 背景层(web_bg) + sidebar(统计卡插槽) + `body-wrap` 开 + `header` 开 + nav；`closeHeader:false` 表示 header 由页级(模板/parts)闭合
- `buildFooter({hideExtra, showExtra, pageScripts, withFooter})` → footer 主体(可关,首页自定义页脚)+ rightside(按钮插槽)+ 公共脚本群 + **页级脚本插槽**(js-pjax 内 mermaid 之后)+ local-search
- `composeShell(opts)` 静态页完整壳(header 恒空、main 内容传入)
- 插槽标记：`<!--NOVA-SITE-DATA-->` / `<!--NOVA-RIGHTSIDE-HIDE--|SHOW-->` / `<!--NOVA-PAGE-SCRIPTS-->` / `<!--NOVA-LATEST-->`(首页最新文章,由 home-generator 动态注入)

---

## 目录职责详解

### `scripts/`（hexo 插件/生成器，**只能放这类文件**）

| 文件 | 职责 |
| --- | --- |
| `site-config.js` | Node 构建期配置单源：`SITE`(从 `_config.yml` 的 url 解析，**顶层不碰 hexo**——见 Hexo 坑①) |
| `parts-common.js` | 公共壳组装函数 + 组件读取(loading/sidebar/nav/footer/评论/按钮) |
| `nova-tags.js` | 标签/索引页 + `search.xml`/`sitemap.xml`/`atom.xml` 生成器；`fmtDate` 来自 `lib/date.js`；search.xml 含歌曲条目(构建期抓取) |
| `lib/music-playlist.js` | 音乐歌单(搜索索引数据源)：构建时请求 B 站云函数 `/api/playlist`，成功回写 `data/music-playlist.json` 缓存，失败用缓存兜底；加减歌曲零人工 |
| `home-generator.js` | 首页：shellTop + hero 段(LATEST 动态注入)+ mid(精选工程/最新文章卡注入)+ 页级 bottom + 公共尾；P5 数据规则见「首页 P5 数据流」 |
| `page-generator.js` | 静态页：PAGES 配置表(pageClass/headerCls/mainCls/pre/showExtra/pageScripts) |
| `projects-generator.js` | 工程页：列表 + 详情(下载链接由 `SITE + encodeURI(url)` 生成) |
| `projects-data.js` / `projects-intro.js` | 工程数据(5 个工程)/ 详情介绍文案(自包含) |
| `lib/fetch-views.js` | **浏览量抓取器(部署前手动运行)**：busuanzi API 带 Referer 查询各页真实 page_pv → 写 `views-cache.json`；24h 缓存、单条失败跳过、手动修改自动保留偏移 |
| `views-cache.json` | 浏览量缓存：`pv`(显示值=排序用) / `shift`(人工偏移) / `lastRaw`·`lastDisplay`(脚本维护)。**手动改只动 `pv` 段**，详见 `views-cache.md` |
| `inject-theme.js` | 文章页首帧主题注入(hexo injector head_begin) |
| `lib/date.js` | `fmtDate`(支持 moment 对象与 Date) |
| `minify.js` | 构建后 JS 压缩(esbuild，`npm run build` 自动跑) |

#### 首页 P5 数据流(生成时全重算, 均无需维护)

- **排序链(确定性 tie-break)**：`updated 降序 → 浏览量降序 → 标题升序`(localeCompare 'zh');批量更新/浏览量同值时结果稳定。
- **LATEST SIGNAL** = 工程+文章合并按上链取第 1 名(带 `[工程]`/`[文章]` 标记)。
- **精选工程** = 工程按 `浏览量降序 → updated → 标题` 取前 3(lead + 2 side,封面=`/img/projects/*.webp`)。
- **最新文章** = 文章按 `updated → 浏览量 → 标题` 取前 6(2 列 3 行)。
- **浏览量**：`views-cache.json` 的 `pv` 段(= busuanzi 真实值 + 人工偏移);缺失时兜底 `projects-data.js` 的 `views` 字段(可选)。
- **文章 updated**：Hexo 原生(无 `updated:` 时=文件 mtime;Marlin-web 本地工作目录 generate,时间真实)。
- **工程 updated**：`projects-data.js` 的 `updated:` 字段(可选) > **`source/assets/projects/<工程名>/` 目录内最新文件的 mtime(自动记录,robocopy 保留源文件时间故同步不污染)** > `date` 兜底。工程页概览第 4 栏"最近更新"与首页 LATEST SIGNAL 的工程日期统一读此链；**更新工程即上传/替换目录内文件,日期自动取最新文件 mtime,零人工**。
- **概览统计条数据**：文章索引(/articles/)四栏 = TOPICS 主题总数 / ARTICLES 文章总数 / TOP TOPIC(最多文章主题+名称) / LATEST UPDATE(最新文章日期+标题)，数值由 `nova-tags.js` 注入；工程页(/projects/)四栏 = PROJECTS 项目总数 / TAGS 技术标签 / TOP PROJECT(真实 pv 最高的工程，pv 数字+工程名) / LATEST UPDATE(更新日期+工程名)，由 `projects-generator.js` 计算(真实 pv 取 `views-cache.json` 的 `lastRaw` 段；全部为 0 时第 3 栏兜底显示最新更新工程)。
- **卡片注入**：mid.html 的 `<!--NOVA-FEATURED-->`/`<!--NOVA-RECENT-->` 与 top.html 的 `<!--NOVA-LATEST-->` 占位由生成器 `split().join()` 替换;卡片 HTML 拼装在 `home-generator.js` 的 `featuredCardsHtml`/`recentCardsHtml`/`latestSignal`。

### `themes/butterfly/layout/`

- `base.pug`：html/head(参数化)/body；`_partials/head.pug`：统一 head(首帧脚本/GLOBAL_CONFIG/注入/extraCss)；`_partials/helpers.pug`：模板共享函数
- `parts-common/`：公共组件(见上)；`*-parts/`：各页纯页级片段；`page-parts/`：静态页纯 main 内容
- `includes/`：**Butterfly 原版布局链**（文章详情页渲染走这里，勿删；`includes/page/moments.pug` 为原版瞬间模板(死代码,保留一致性)）

### `source/`

- `img/` 按用途分层：`hero/`(页面横幅背景) `music/`(音乐页资源) `brand/`(品牌头像图标) `misc/`(杂项+站点预览图) `covers/`(文章封面) `projects/`(工程图)
- `rose-galaxy/`：自定义层——`css/`(每页一个样式文件,前缀 `nova-`)、`js/`(页面脚本 + `lib/` 共享件)、`animation/`(动画脚本)、`fonts/`(自托管字体)
- `assets/projects/<工程名>/`：下载文件(与页面路由 `projects/` 隔离,避免命名空间冲突)
- `css/index.css`：**上游 Butterfly 副本，勿改**；`css/custom.css`：全站覆盖唯一去处

### `py-tools/`（外部工具，hexo 不加载）

- `tools/`：构建/验证常用(convert_* 图片转换、audit_imgs、check_pages_text、find_orphans、self_check、verify_*)
- `archive/`：一次性/历史补丁(patch_*、fix_*、pure_parts、extract_parts、slice_*、rename_refs 等)

---

## 配置图鉴

| 配置件 | 位置 | 内容 | 维护提示 |
| --- | --- | --- | --- |
| Node 构建期 | `scripts/site-config.js` | `SITE` | 从 `_config.yml` 读；改域名改 yml |
| 前端运行时 | `source/rose-galaxy/js/lib/site-config.js` | `window.NOVA_SITE.bili`(云函数代理/UID/收藏夹) | 换 B 站源只改这里；加载顺序:yml inject.head 位于 nova-player.js 之前(defer 保序) |
| 前端工具 | `source/rose-galaxy/js/lib/utils.js` | `window.NOVA_UTILS.formatTime` | 播放器/音乐页共用 |
| 日期工具 | `scripts/lib/date.js` | `fmtDate` | |
| 主题配置 | `_config.butterfly.yml` | 导航菜单/搜索/注入(共享件+播放器)/aside | inject.head 顺序=文档顺序 |
| 站点配置 | `_config.yml` | url / permalink:`posts/:title/` / tag_dir:`articles` | |

---

## 样式规范

三层职责（**改动必须对号入座**）：

| 层 | 文件 | 规则 |
| --- | --- | --- |
| 上游(勿动) | `source/css/index.css` | Butterfly 副本；头部已标"请勿修改" |
| 全站覆盖 | `source/css/custom.css` | 唯一覆盖去处；头部有总目录注释；分段 `/* ---- 段名 ---- */` 保留日期与意图 |
| 页级 | `source/rose-galaxy/css/{page}-page.css` | 每页一文件；类名前缀 `nova-` |

关键规则位置：

- **页脚横幅**：`custom.css` 中 `html[data-theme=dark|light] body:not(.nova-home-active) footer#footer`(玫瑰横幅 archive-bg.webp，深 `#080c17`/浅 `#d5d4de` 底)；首页为自定义 `.nova-footer` 排除在外；页级 css 中**不要再定义 footer 背景**(曾因覆盖导致横幅消失/矛盾,已收敛)
- **#page-header 层叠（R6 标注）**：涉及 7 个文件(custom 19 处 / index 58 处 / 页级 19 处)——改 header 前需全局检索 `#page-header`；大部分为分层覆盖设计(主题底→全站覆盖→页级 hero)，勿简单增加规则，考虑现有层叠
- **版本号约定**：所有 css/js 引用带 `?v=<日期>-<标签>`(当前 `20260829-p1`)。**引用文件内容变更时必须 bump**，否则浏览器用旧缓存(曾出现旧路径图片 404/样式回退)

---

## 构建与部署

```bash
npm run build     # hexo generate && node scripts/minify.js(esbuild 压缩全部 JS)
npm run server    # 本地预览(改动脚本/配置/模板后须重启!)
```

**发布流程（演示站 → 线上）**：

1. **演示站**（从 `Marlin-web` 克隆：`robocopy /E` + node_modules 符号链接(junction) + 预建 `public/` 空目录，否则 minify.js 启动即 ENOENT）完成改动 → `hexo clean && hexo generate` → 页面回归(元素/JS/图片 404)（注意：hexo server 用内存旧脚本，改 scripts/ 须重启 server）
2. **用户验收 + 明确批准**后：
   - 镜像演示站 → `Marlin-web`（工作区源）：layout / source(rose-galaxy,css,js,img,assets) / scripts / _config*.yml / README·MAINTENANCE·DEPLOY 等；**只复制改动文件**（或 robocopy 按目录，注意目标多出的旧文件会被删(这正是想要的)）
   - （可选）`node scripts/lib/fetch-views.js` 刷新浏览量缓存（部署前运行，busuanzi 抓取；24h 内有缓存且未加 `--force` 不重复抓取）
   - `Marlin-web` 下 `hexo clean && hexo generate`（先停任何 server；`hexo clean` 后若 `2026/` 等空目录残留手动删一次）
   - `hexo deploy`（推送 **public 分支**，GitHub Pages 使用）
   - 镜像 `Marlin-web` 的源码/文档/配置 → **`C:\Users\mabin\Desktop\web\SourceCode`（git main 仓库）** → `git add <改动文件> && commit && push`（SourceCode 是源码仓库，**只提交源码/文档，构建产物(public 根目录等)不入库**；历史提交均为显式列出的文件）
3. 线上验证：curl 关键路由(首页/moments/articles/posts 示例/projects/sitemap.xml) + 抽查资源版本号

---

## 发布审批规则

> 强制规则（2026-08-27 立此存照，详见 `data/STRUCTURE-REFACTOR.md`）：

1. 所有改动先在演示站完成并验证。
2. **未经用户明确批准，禁止任何提交/推送/部署**（git push / hexo deploy / GitHub Pages / SourceCode）。发布动作必须逐次明确授权。
3. 结构性/行为性决策先询问用户。
4. 修复完成后只汇报验证结果并请求批准；禁止以"已验证/惯例/之前授权过"为由自行发布。

---

## Hexo 工程坑（务必阅读）

1. **hexo 用 vm 包装加载 scripts/*.js**：`(async function(exports, require, module, __filename, __dirname, hexo){...})`——`hexo` 只作为参数传给**被直接加载的脚本**；**内部 `require` 的模块拿不到 hexo**（写共享模块勿在顶层用 hexo——曾致 "hexo is not defined"/"not a function"）。共享模块要么不依赖 hexo（如 site-config.js 直接读 yml），要么导出工厂由生成器传参——后者同样可能有加载顺序问题，**首选零依赖方案**。
2. **hexo 会执行 scripts/ 下所有 .js**：一次性工具(顶层立即写文件)放这里会污染源文件——`pure_parts.js`/`extract_parts.js`/`slice_footer.js` 曾把 page-parts 与 footer.html 覆盖回旧版（"双 nav/横幅丢失"的元凶），已迁 `py-tools/archive/`。
3. **hexo server 不热加载配置/模板/插件**：改 `scripts/`、`_config*.yml`、模板后必须**重启 server**；且 **server 会用内存旧脚本重新生成并覆盖 public**——改动生成器后请**先停 server** 验证，验证完再重启。
4. **浏览器缓存**：CSS/JS 版本号未变时，强刷(Ctrl+Shift+R)或隐私窗口验证。
5. **hexo partial `cache: true` 会缓存旧模板**：改 partial 后不生效，改用 `include` 或删 db.json + `hexo clean`。
6. **Hexo excerpt 是渲染后的 HTML**：生成摘要须先剥离 HTML 标签，否则残留未闭合标签破坏卡片 DOM。
7. **hexo generate 不删孤儿文件**：删除文章/页面后需 `hexo clean` 再 generate；偶尔 `2026/`/空目录残留需手动删（server 竞争或 clean 未彻底时）。
8. **headless 截图陷阱**：虚拟时钟会冻结入场动画、缓存旧 CSS，验证用全新 profile + 像素采样。

---

## 常见任务

- **写文章**：见 README「加文章」。
- **加工程**：见 README「加工程」。
- **换 B 站收藏夹源**：改 `source/rose-galaxy/js/lib/site-config.js` 的 `NOVA_SITE.bili` → bump `utils.js?` 无需，但 **bump site-config.js 引用处版本号**(yml inject) 防缓存。
- **换页脚横幅图**：替换 `source/img/hero/archive-bg.webp`(保持文件名)；改色 → `custom.css` 两套规则；**勿在页级 css 加 footer 背景**。
- **换页面 hero 背景**：页面级 css(`{page}-page.css`)中对应 `#page-header`/`.nova-hero-bg` 规则 → 图片放 `img/hero/` → bump 该 css 版本号。
- **更新工程(日期同步)**：替换/新增 `source/assets/projects/<工程名>/` 下资源 → 工程页"最近更新"与首页 LATEST SIGNAL 自动更新为目录内最新文件 mtime(无需改代码);无文件时回退 `projects-data.js` 的 `date`(仅年份)。
- **版本号升级**：改 `_config.yml` 的 `version:` 一行(权威源, pug/生成器引用自动生效) → 全站搜索 `?v=` 确认 `_config.butterfly.yml`(10 处) 与 html 片段(parts-common/footer、page-scripts 等) 的字面量同步手动改(这些无插值能力)。
- **发布**：见「构建与部署」+「审批规则」。

---

## 排障清单

| 症状 | 常见原因 → 处理 |
| --- | --- |
| 页面元素/样式缺失、图片 404 | 浏览器缓存旧引用 → Ctrl+F5；仍存在则检查版本号是否已 bump |
| 首页 hero 塌陷、白区 | 曾因 LATEST/闭合链双份(P1b 提取遗留)——检查 `home-parts/top.html` 占位 `<!--NOVA-LATEST-->` 与 `mid.html` 无旧闭合链；产物中 `nova-latest-signal`/`nova-scroll-hint` 应各 1 处 |
| 生成器不输出(xml/索引缺失) | `scripts/` 加载失败(hexo is not defined / not a function) → 检查共享模块是否顶层用了 hexo；`ERROR Script load failed` 必先看 |
| 文件被"还原" | `scripts/` 混入一次性工具 → 移到 `py-tools/archive/`；从 git(SourceCode) 恢复 |
| 改动不生效 | hexo server 未重启(内存旧脚本/旧产物) → 停 server→clean→generate→重启 |
| footer 横幅异常 | 页级 css 又有 footer 背景规则 → 删；`custom.css` 两套规则(md 主题前缀)是唯一来源 |
| 评论不见 | Waline 按 path 存储——页面路径变更后旧评论不显示(非 bug)；需迁移在数据层处理 |
