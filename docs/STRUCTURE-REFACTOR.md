# Marlin-web 结构重构方案（2026-08-27 修订版）

> 本文档条目与实况同步更新。**执行约定**：所有改动先在演示站 `Marlin-web-demo2`（`C:\Users\mabin\Desktop\work\Marlin-web-demo2`）完成并验证，再同步生产 `Marlin-web`；改动前有结构性/行为性决策先询问。
> **当前进度**：P1 已全部完成（demo2 已验证，未推生产）；P2/P3 决策已定待执行；P4 待做。

---

## 一、P1 去重——已完成（demo2）

### 1.1 P1(a)：公共段提取与生成器拼接壳
- `scripts/parts-common.js` 公共壳组装函数：
  - `composeShellTop({pageClass, headerCls, headerStyle, siteData, pre, closeHeader})` → loading + 背景层 + sidebar + body-wrap 开 + header 开 + nav
  - `buildFooter({hideExtra, showExtra, pageScripts, withFooter})` → footer 主体(可关) + rightside(扩展按钮插槽) + 公共脚本群 + 页级脚本插槽 + local-search
  - `composeShell(opts)` 静态页完整壳
- `themes/butterfly/layout/parts-common/` 公共组件（单一来源）：
  - `nova-loading.html`（加载动画，会话记忆版：首次进入显示、刷新不再弹）
  - `sidebar.html`（`<!--NOVA-SITE-DATA-->` 统计卡插槽）
  - `nav.html`（完整含闭合；修复了旧版缺 `</nav>`）
  - `footer.html`（公共尾部，插槽：页面脚本 / rightside 隐藏组 / rightside 显示组）
  - `waline-comment.html`（评论初始化脚本，仅评论区页注入）
  - `rightside-comment.html`（"去评论"按钮）、`rightside-aside.html`（"单双栏切换"按钮）
- `page-parts/{music,shuoshuo,about,404}.html` 重写为**纯 main 内容**（wrapper/header/nav/main 开闭/页级脚本全部参数化到 `scripts/page-generator.js` PAGES 配置）
- `scripts/page-generator.js` 配置式重写：pageClass/headerCls/mainCls/pre/showExtra/pageScripts 每页一配置；courses 已删除
- 页级 CSS 统一走 pug `extraCss`（head），不再出现在 body 底部

### 1.2 P1(b)：idx/tag/home/project 壳集成
- `idx-parts/`、`tag-parts/`、`home-parts/`、`project-parts/` 重写为纯页级内容；`idx-parts/bottom.html` 已删除（页级为空）
- 生成器接入公共壳：`nova-tags.js`（文章索引/标签页）、`home-generator.js`（首页，背景层 pre=web_bg）、`projects-generator.js`（工程页/工程详情）
- 模板改用 shellTop/shellBottom：`tags-index.pug`、`tag.pug`、`home.pug`、`projects.pug`、`project-detail.pug`
- `project-detail.pug` 删除 pug 内硬编码的 sidebar/nav（约 60 行）与写死的"工程 5"统计
- sidebar 统计卡**动态化**：idx/tag=实际文章数、projects=实际工程数（原写死 16/5）
- tag-page.css 移入 `tags-index.pug`/`tag.pug`/`projects.pug` 的 `extraCss`（原在 body 底部）

### 1.3 P1(c)：常量与工具去重（R5/R7）
- `source/rose-galaxy/js/lib/site-config.js`：`window.NOVA_SITE.bili`（BILI_PROXY/BILI_UID/BILI_FOLDER 单一来源，原 nova-player.js + music-page.js 双份）
- `source/rose-galaxy/js/lib/utils.js`：`window.NOVA_UTILS.formatTime`（原两处完全一致的实现）
- 消费方：nova-player.js / music-page.js 改为读取共享件（源码零残留）
- `scripts/lib/date.js`：Node 侧 `fmtDate`（支持 moment/Date），nova-tags.js（删本地实现）与 projects-generator.js（TODAY）统一引用
- 注入顺序：`_config.butterfly.yml` inject.head 中 site-config.js → utils.js → nova-player.js（defer 按文档序，保证先就绪）

### 1.4 脚本目录规范（根治污染）
- **hexo 会自动执行 scripts/ 下所有 .js**——一次性工具（顶层代码立即写文件）曾污染 parts：
  - `pure_parts.js`（读 prod parts 写 demo2 page-parts）→ 迁 `py-tools/`
  - `extract_parts.js`、`slice_footer.js` → 迁 `py-tools/`
  - `minify.js` 保留（构建后压缩 JS，自动+手动，prod 同款）
- 迁移时修正路径指向 Marlin-web-demo2；`scripts/` 只余 hexo 插件/生成器（inject-theme/parts-common/nova-tags/home-generator/page-generator/projects-generator/projects-data/projects-intro）

### 1.5 P1 期间顺带修复
- 首页尾部重复 `</body></html>` 闭合
- 工程详情页：移除误引用的 tag-page.css 与多余的 waline 初始化脚本
- 工程页概览区依赖 tag-page.css（P1(b) 漏加 → 概览裸显示/footer 错位），`projects.pug` 补 tag-page.css
- 404 页背景大图 `error-bg.webp`（web_bg 背景层）与 music 页 web_bg DOM 补回（P1(a) 提取遗漏，与 prod 对齐）
- footer 底部横幅全局两态收敛：
  - `custom.css` 全局改为 `html[data-theme="dark"]/light body:not(.nova-home-active) footer#footer` 两套（玫瑰横幅 archive-bg.webp：深 `#080c17` 底 / 浅 `#d5d4de` 底）
  - 删除/收敛 `tag-page.css`(2) / `music-page.css`(3) / `shuoshuo-page.css`(2) / `about-page.css`(2) 页级 footer 背景矛盾规则（保留 margin/border 等布局细节）
  - 结果：除首页（自定义 nova-footer）外，全部页面深浅两态 footer 横幅一致

### 1.6 P1 验证
- 渲染产物前后 diff：首页仅 7 字节空白差异；关键锚点（nav/footer/rightside/脚本群）计数一致
- Playwright 10 页面（首页/文章索引/标签/工程页/工程详情/音乐/说说/关于/404/文章详情）元素+JS 全通过；pjax 导航正常；深/浅主题横幅四态一致
- 连续两次 `hexo generate` 后 parts 无再生污染（legacy 工具迁移生效）

---

## 二、P2 分类——待做（决策已定）

| 项 | 内容 | 已定决策 |
|---|---|---|
| C2 img 分层 | `source/img` 31 散图 + brand/covers/projects 归入用途子目录（hero/ music/ brand/ covers/ projects/ misc/），同步更新所有引用 | **A 按用途建子目录** |
| C4 动画目录 | galaxy-canvas.js / decorative-loader.js 等整文件归 `rose-galaxy/animation/`，同步引用 | **A 归整文件，@keyframes 不动**（15 个 @keyframes 分属 about/music/night-visitor/nova-home 页级 css，归属正确） |
| C6 删空目录 | `source/{about,music,shuoshuo,courses}` 4 个空目录（页面已由生成器产出；courses 页面已删） | 直接删除 |
| 文章页 | 2026/08/17/... 走 Butterfly post 模板，本轮**不含**（后续单列） | 已定 |

**备注**：C1（public/2026 与 articles 双路由）维持（Hexo 标准路由，非重复）。孤儿图仅 `error-bg.webp`（已恢复引用）；`music*-preview.webp`、`projects/demo-*.webp` 为 JS 动态拼接路径（非孤儿）。

## 三、P3 命名——待做（决策已定）

| 项 | 内容 | 已定决策 |
|---|---|---|
| C3 shuoshuo→moments | 全量改：URL `/shuoshuo/`→`/moments/`、source/public/js/css/模板/parts/文案/类名 | **URL 也改**（GitHub 部署，旧链接由新链接接替；无 301，旧收录链接失效可接受） |

影响面：`source/rose-galaxy/js/{shuoshuo-page}.js`、`css/shuoshuo-page.css`、`themes/.../page-parts/shuoshuo.html`、`shuoshuo.pug`、parts-common/waline-comment.html（isShuoshuo 判定）、README/文案、nav/sidebar 菜单项、waline 路径挂载等。

## 四、P4 清理——待做

| 项 | 内容 | 状态 |
|---|---|---|
| C5 配置收敛 | 建 `scripts/site-config.js`（Node 侧单一来源：域名/BILI/常量），生成器 require；yml 维持标准位 | 前端部分已完成（js/lib/site-config.js）；Node 侧未做 |
| C7 py-tools 拆分 | 35 个脚本按"构建用 tools/"与"一次性 archive/"拆分 | 未做 |
| M1 index.css 标注 | `source/css/index.css`（196KB Butterfly 副本）加"上游文件勿改，覆盖只写 custom.css"头部标注 | 未做（当前无标注） |
| M2 custom.css 分段 | 55KB 全站覆盖按域分段注释（nav/footer/hero/页面） | 未做 |
| M4 内联脚本迁出（剩余） | page-parts 内联脚本已全部迁出；剩余 3 块属公共壳：footer.html 的 mermaid 内联(13KB)+ walineFn（已在独立 waline-comment.html 文件）+ nova-loading 内联——可评估迁 rose-galaxy/js/ | 部分完成 |
| N3 命名（可选） | night-visitor → nova-visitor（统一 `nova-{domain}.js`） | 未定 |
| N5 命名（可选） | nova-404.pug → 404.pug（对齐路由） | 未定 |
| R6 #page-header 层叠覆盖 | custom 19 + index 58 + 页级 19 = 103 处分布 7 文件；多为分层覆盖设计（非重复副本），尚未处理 | **未定**（见第七节） |

**M3/M5 已随 P1 完成**：page-parts 大文件已拆（纯内容+生成器参数化）；生成器统一走 parts-common 壳组装。

## 五、问题清单终态

| # | 项 | 终态 |
|---|---|---|
| R1 | 导航菜单 19 处重复 | ✅ P1(a/b) 单源（parts-common/nav.html） |
| R2 | footer 7 处重复 | ✅ P1(b) 单源（含按钮/页脚参数化） |
| R3 | sidebar 9 处重复 | ✅ P1(b) 单源（统计卡动态化） |
| R4 | 公共脚本 6 文件重复 | ✅ P1(b) 入公共尾部单源 |
| R5 | BILI 常量双份 | ✅ P1(c) js/lib/site-config.js |
| R6 | #page-header 跨 7 css | ⏳ 见第七节 |
| R7 | formatTime 双份 | ✅ P1(c) js/lib/utils.js |
| C1 | 2026/articles 双路由 | ✅ 维持（非重复） |
| C2 | img 分层 | ⏳ P2（A 已定） |
| C3 | shuoshuo→moments | ⏳ P3（URL 改已定） |
| C4 | 动画目录 | ⏳ P2（A 已定） |
| C5 | 配置分散 | ⏳ P4（前端部分已做） |
| C6 | 空目录 | ⏳ P2（4 个空目录） |
| C7 | py-tools 拆分 | ⏳ P4 |
| M1 | index.css 标注 | ⏳ P4 |
| M2 | custom.css 分段 | ⏳ P4 |
| M3 | page-parts 大文件 | ✅ P1(a) 拆分 |
| M4 | 内联脚本迁出 | ✅ 页级全部迁出；公共壳 3 块可选（P4） |
| M5 | 生成器统一 | ✅ P1 完成 |
| N1 | nova- 前缀 | ✅ 维持 |
| N2 | {page}-page.* 命名 | ✅ 维持 |
| N3 | nova-{domain}.js | ⏳ 可选（未定） |
| N4 | *-generator/*-data 约定 | ✅ 维持 |
| N5 | nova-404→404 | ⏳ 可选（未定） |

## 六、执行顺序

P2（C2/C4/C6）→ P3（C3, URL 变更）→ P4（C5/C7/M1/M2/R6 决策后）→ 可选（N3/N5）
每期：demo2 改动 → hexo generate + 前后渲染对比 + Playwright 回归 + 浏览器目检 → 用户确认 → 推生产（demo2→Marlin-web→hexo generate+deploy→SourceCode 同步提交推送）。

## 七、待决策项

1. **R6 处理方式**：A 维持现状+文档标注（推荐，零风险）/ B 冲突侦察后收敛真冲突 / C 全面收敛 103 处（工作量大，不推荐）
2. **N3/N5**：night-visitor→nova-visitor 及 nova-404→404 是否做（可选，低价值）
3. **M4 剩余**：mermaid 内联脚本/loading 脚本是否迁 rose-galaxy/js/（公共壳内联，迁出需同步调整注入顺序）
