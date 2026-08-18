# 部署指引(GitHub Pages + Cloudflare Worker)

## 结构

```
仓库 deymocn/deymocn.github.io
├── main 分支    = 本站源码(本目录;public/、node_modules/ 不入库)
└── gh-pages 分支 = 构建产物(hexo generate 输出,hexo deployer-git 自动推送)
```

站点:https://deymocn.github.io/
B 站音乐试验页:https://deymocn.github.io/bili-music/(需配合 Cloudflare Worker 代理)

## 一、GitHub 侧(需要你的账号,一次性)

1. GitHub 上创建空仓库,名字必须是 `deymocn.github.io`(用户名仓库,不要勾选任何初始化文件)。
2. 本机执行(已配置 remote 后):
   ```bash
   git remote add origin https://github.com/deymocn/deymocn.github.io.git
   git push -u origin main
   ```
3. 仓库 Settings → Pages → Build and deployment → Source 选 "Deploy from a branch" → Branch 选 `gh-pages` / `/ (root)` → Save。

## 二、构建与部署(以后每次更新站点)

```bash
hexo clean && hexo generate && hexo deploy
```
`hexo deploy` 会把 `public/` 推送到 gh-pages 分支,Pages 自动生效。
(第一次 push 会提示输入 GitHub 账号/令牌;HTTPS 推送到 GitHub 建议用 Personal Access Token 作为密码。)

## 三、Cloudflare Worker(B 站音乐代理,免费)

1. Cloudflare Dashboard → Workers & Pages → 创建 Worker。
2. 把 `tools/gh-pages-music-test/worker.js` 的内容整体粘贴进去 → 部署。
3. 记下生成的地址,形如 `https://你的子域.workers.dev`。

## 四、B 站音乐试验页

1. 访问 https://deymocn.github.io/bili-music/
2. 在"代理地址"输入框填入 Worker 地址(如 `https://xxx.workers.dev`)。
3. 输入 BVID(如 BV1GJ411x7h7)添加歌曲试听。

## 已知边界(实测结论)

- B 站 API 无 CORS、音频 CDN 要求 `Referer: bilibili.com`,浏览器直连必失败,必须走代理;本工程 worker.js 已验证该链路(206 分段拉流正常)。
- **Cloudflare 免费域名 `workers.dev` 在国内访问不稳定**:如果线上听不到歌,优先怀疑这一点;长期方案是给 Worker 绑定自定义域名(需域名托管到 Cloudflare)。
- **B 站风控**:Worker 出口是机房 IP,可能被 B 站拦截(常见 -412/验证码)。本地听歌正常不代表 Worker 一定正常,部署后必须实测。
- 若 Worker 被风控:退回方案 A——把音频下载为 mp3 放入 `source/` 本地托管,零代理、百分百可听(歌单固定)。
- 版权:仅限自用试听。

## 本地开发

```bash
npm install        # 首次
hexo server -p 4000
```
