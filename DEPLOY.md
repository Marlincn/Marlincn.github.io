# 部署指引(GitHub Pages)

## 结构

```
仓库 marlincn/marlincn.github.io
├── main 分支    = 本站源码(本地仓库: C:\Users\mabin\Desktop\web\SourceCode;
│                  public/、node_modules/、构建产物不入库)
├── public 分支  = 构建产物(hexo generate 输出,hexo deployer-git 自动推送)← GitHub Pages 使用此分支
└── waline 分支  = 评论后端(Waline serverless 模板,Vercel)
```

### 本地目录分工

| 目录 | 角色 | Git |
|---|---|---|
| `C:\Users\mabin\Desktop\work\Marlin-web` | **工作区**(hexo 源码 + 开发/构建) | 非 git 仓库 |
| `C:\Users\mabin\Desktop\web\SourceCode` | **main 仓库本地副本**(源码/文档) | git(origin=同一 GitHub 仓库) |

**日常流程**：工作区 `Marlin-web` 改动并验证(演示站先行) → 经用户批准后：① `hexo deploy` 推送 **public** 分支(构建产物) ② 把改动源码/文档复制到 `web\SourceCode` → `git add`(显式列文件) → `commit` → `push`(main)。详见 `MAINTENANCE.md`「构建与部署」。

站点:https://marlincn.github.io/

> ⚠️ 注意:线上 GitHub Pages 使用 **public** 分支。`_config.yml` 的 `deploy.branch` 必须为 `public`(曾误配为 `gh-pages`,该分支线上不存在,导致 deploy 推错方向),`.deploy_git` 的分支与 merge 也须指向 `public`。

## 一、GitHub 侧(需要你的账号,一次性)

1. GitHub 上创建空仓库,名字必须是 `marlincn.github.io`(用户名仓库,不要勾选任何初始化文件)。
2. 本机执行(已配置 remote 后):
   ```bash
   git remote add origin https://github.com/marlincn/marlincn.github.io.git
   git push -u origin main
   ```
3. 仓库 Settings → Pages → Build and deployment → Source 选 "Deploy from a branch" → Branch 选 `public` / `/ (root)` → Save。

## 二、构建与部署(以后每次更新站点)

```bash
hexo clean && hexo generate && hexo deploy
```
`hexo deploy` 会把 `public/` 推送到 public 分支,Pages 自动生效。
(第一次 push 会提示输入 GitHub 账号/令牌;HTTPS 推送到 GitHub 建议用 Personal Access Token 作为密码。)

## 三、B 站音乐(腾讯云函数,已启用)

- 音乐源:B 站公开收藏夹(music,UID 见 `source/rose-galaxy/js/lib/site-config.js` 的 `NOVA_SITE.bili`);音频经**腾讯云函数**代理拉流(`bili.proxy`,SCF `stream2` 接口)。
- 云函数部署在腾讯云(SCF,广州战区);换代理地址只改 `site-config.js` 并 bump 版本号,无需动云函数(除非云函数本身维护)。
- 播放链路:浏览器 → 云函数 `stream2?bvid=` → B 站音频流(206 分段),播放器为原生 Audio(`nova-player.js` + 音乐页 `music-page.js`)。

## 四、本地开发

```bash
npm install        # 首次
hexo server -p 4000
```

> 旧方案(已弃用): 早期曾用 Cloudflare Worker + `bili-music` 试验页,已随音乐系统迁移(2026-08-18)移除,如见旧引用请忽略。

## 已知边界(实测结论)

- B 站 API 无 CORS、音频 CDN 要求 `Referer: bilibili.com`,浏览器直连必失败,必须走代理;云函数链路已验证(206 分段拉流正常)。
- **B 站风控**:云函数出口是机房 IP,可能被 B 站拦截(常见 -412/验证码)。本地听歌正常不代表云函数一定正常,部署后必须实测。
- 若云函数被风控:退回方案 A——把音频下载为 mp3 放入 `source/` 本地托管,零代理、百分百可听(歌单固定)。
- 版权:仅限自用试听。
