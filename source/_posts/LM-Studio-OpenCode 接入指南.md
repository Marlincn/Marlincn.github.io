---
title: LM Studio 接入 OpenCode 指南
date: 2026-08-17 00:00:00
tags:
  - AI
---
## 1. 环境信息

| 项目 | 值 |
|------|-----|
| LM Studio 版本 | 0.4.0+（需要 API Token 功能） |
| LM Studio 地址 | `http://192.168.133.2:1234` |
| 本地模型 | `qwen3.5-9b` |
| OpenCode 配置路径 | `~/.config/opencode/opencode.jsonc` |
| OpenCode 认证路径 | `~/.local/share/opencode/auth.json` |
| 操作系统 | Windows |

> **说明**：OpenCode TUI 和 GUI 共享同一份全局配置文件，配置一次两者皆可用。

---

## 2. LM Studio 端配置

### 2.1 加载模型

在 LM Studio 中搜索并下载 `qwen3.5-9b`，加载时注意调整 **Context Length（上下文长度）**：

> **关键**：默认上下文长度为 4096，不足以容纳 OpenCode 的系统提示（约 9000+ tokens）。必须调到 **8192 或 16384**。

操作方法：加载模型时，在模型设置中找到 "Context Length" 滑块，拖动至 8192 以上。

### 2.2 开启认证（可选但已配置）

1. 进入 LM Studio → **Developers** → **Server Settings**
2. 打开 **Require Authentication** 开关
3. 点击 **Manage Tokens** → **Create Token**
4. 输入名称（如 `opencode`），权限全选，点击创建
5. **立即复制 Token**（关闭后不可再次查看）

Token 格式示例：`sk-lm-xxxxxxxx:xxxxxxxxxxxxxxxx`

### 2.3 启动 API 服务

确保 LM Studio 的 Developer Server 已启动，默认端口 1234。

开放 API 端点：
- `http://192.168.133.2:1234/v1/models` — 模型列表
- `http://192.168.133.2:1234/v1/chat/completions` — 聊天补全

---

## 3. OpenCode 配置文件说明

OpenCode 通过两个文件管理本地模型接入：

| 文件 | 用途 |
|------|------|
| `~/.config/opencode/opencode.jsonc` | Provider 定义、模型列表、默认模型、系统指令 |
| `~/.local/share/opencode/auth.json` | API Key / Token 存储 |

> **重要**：修改这两个文件后，**必须完全退出并重新启动 OpenCode** 才能生效。OpenCode 仅在启动时读取配置。

---

## 4. 配置 Provider（opencode.jsonc）

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "请始终使用简体中文回复..."
  ],
  "model": "mymodel/qwen3.5-9b",
  "disabled_providers": [],
  "provider": {
    "mymodel": {
      "name": "qwen3.5-9b",
      "npm": "@ai-sdk/openai-compatible",
      "options": {
        "baseURL": "http://192.168.133.2:1234/v1"
      },
      "models": {
        "qwen3.5-9b": {
          "name": "qwen3.5-9b"
        }
      }
    }
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `provider.<id>` | 自定义 Provider ID，使用时格式为 `<id>/<model>`，如 `mymodel/qwen3.5-9b` |
| `npm` | 必须为 `@ai-sdk/openai-compatible`，表示兼容 OpenAI 协议 |
| `name` | 在 `/models` 列表中显示的 Provider 名称 |
| `options.baseURL` | **必须以 `/v1` 结尾**，指向 LM Studio 的 OpenAI 兼容端点 |
| `models.<key>` | key 必须与 LM Studio 返回的 `id` 字段完全一致 |
| `model` | 全局默认模型，设为 `mymodel/qwen3.5-9b` 即为默认走本地 |
| `disabled_providers` | 黑名单列表，包含的 Provider 不可用。必须为空 `[]` 或移除 `mymodel` |

### 坑：baseURL 不带 /v1

LM Studio 的 API 在 `/v1` 路径下，如果不加 `/v1`，OpenCode 的请求会发到错误路径导致失败。

### 坑：disabled_providers

如果 Provider 在被禁名单中，`/model` 列表中不会出现该项，也无法使用。

---

## 5. 配置认证（auth.json）

```json
{
  "deepseek": {
    "type": "api",
    "key": "sk-e3e81ea49c1e4b60a9968e15e92ab0c0"
  },
  "mymodel": {
    "type": "api",
    "key": "sk-lm-kut5WPBn:Zrxm010EkZpw75ILTV4d"
  }
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| Provider ID（key） | 必须与 `opencode.jsonc` 中的 provider ID 完全一致 |
| `type` | 固定为 `"api"` |
| `key` | LM Studio 中创建的 API Token |

### 坑：使用假 Token

LM Studio 如果开启了认证，会验证 Token 格式。随意填写的假 Token（如 `lm-studio-local`）会被拒绝，报错：

```
Malformed LM Studio API token provided: lm-studio-*****
```

### 坑：未提供 Token

如果 `auth.json` 中没有该 Provider 的认证信息，且 LM Studio 开启了认证，会报错：

```
An LM Studio API token is required to make requests to this server,
but none was provided using the Authorization header
```

### 坑：LM Studio 默认不要求认证

如果 LM Studio 未开启 "Require Authentication"，则**不需要**配置认证信息。`auth.json` 中不要添加该 Provider 条目，否则假 Token 可能被格式校验拒绝。

---

## 6. 遇到的错误及解决方法

### 错误 1：Provider 被禁用

**现象**：`/model` 列表中看不到自定义 Provider。

**原因**：`disabled_providers` 中包含该 Provider ID。

**解决**：将 `disabled_providers` 中对应的项移除，或设为空数组 `[]`。

---

### 错误 2：Malformed LM Studio API token

```
Malformed LM Studio API token provided: lm-studio-*****.
Ensure you are using a valid token.
```

**原因**：使用了假的 Token（如 `lm-studio-local`），LM Studio 开启了认证且校验了 Token 格式。

**解决**：
1. 在 LM Studio → Developers → Manage Tokens 中创建真实 Token
2. 将 Token 填入 `auth.json` 对应 Provider 的 `key` 字段
3. 重启 OpenCode

---

### 错误 3：缺少 Token（LM Studio 开启了认证）

```
An LM Studio API token is required to make requests to this server,
but none was provided using the Authorization header
using the 'Bearer' scheme
```

**原因**：`auth.json` 中没有该 Provider 条目，但 LM Studio 开启了认证。

**解决**：方案一：在 LM Studio 关闭 "Require Authentication"；方案二：按步骤创建 Token 并写入 `auth.json`。

---

### 错误 4：上下文长度不足

```
The number of tokens to keep from the initial prompt is greater than
the context length (n_keep: 9199 >= n_ctx: 4096).
Try to load the model with a larger context length, or provide a shorter input.
```

**原因**：LM Studio 加载模型时上下文窗口（n_ctx）默认为 4096，但 OpenCode 的系统提示约 9000+ tokens。

**解决**：在 LM Studio 中卸載并重新加载模型，将 **Context Length** 调至 **8192** 或更高（建议 16384）。

---

### 错误 5：配置修改后不生效

**现象**：修改了 `opencode.jsonc` 或 `auth.json`，但 OpenCode 仍报旧错误。

**原因**：OpenCode 仅在启动时读取配置文件。

**解决**：**完全退出 OpenCode（包括系统托盘），重新启动。**

---

## 7. 验证方法

### 7.1 验证 Token 和 API 连接

```bash
# 测试模型列表（应返回 HTTP 200）
curl.exe -s -o NUL -w "%{http_code}" "http://192.168.133.2:1234/v1/models" -H "Authorization: Bearer <TOKEN>"

# 查看可用模型
curl.exe -s "http://192.168.133.2:1234/v1/models" -H "Authorization: Bearer <TOKEN>"
```

### 7.2 验证聊天补全

创建测试 JSON 文件 `test_body.json`：

```json
{"model":"qwen3.5-9b","messages":[{"role":"user","content":"测试，回复一句话"}],"max_tokens":50}
```

发送请求：

```bash
curl.exe -s "http://192.168.133.2:1234/v1/chat/completions" -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "@test_body.json"
```

预期返回正常 JSON 响应，包含 `choices[0].message.content`。

### 7.3 验证 OpenCode 切换

在 OpenCode 中输入 `/model`，应看到 `mymodel/qwen3.5-9b`。选中即可切换。

---

## 8. 进阶：配置图片识别子代理

如果需要为本地模型添加视觉能力，可以接入免费的云端视觉模型（如 Xiaomi MiMo-V2.5）：

```jsonc
// opencode.jsonc 中追加
"provider": {
  "mimo": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "Xiaomi MiMo",
    "options": {
      "baseURL": "https://api.xiaomimimo.com/v1"
    },
    "models": {
      "mimo-v2.5": {
        "name": "MiMo-V2.5"
      }
    }
  }
}
```

创建子代理文件 `.opencode/agents/image-recognizer.md`：

```markdown
---
description: 图片识别子代理，使用 MiMo-V2.5 视觉模型分析图像
mode: subagent
model: mimo/mimo-v2.5
---
你是一个图片识别专家。用户会提供图片，你需要详细描述图片内容，使用中文回复。
```

Token 获取：前往 <https://platform.xiaomimimo.com>→ API Keys → 创建 Key。

---

## 9. 参考文档

- [OpenCode Providers 配置文档](https://opencode.ai/docs/providers/)
- [OpenCode Agents 配置文档](https://opencode.ai/docs/agents/)
- [OpenCode Config 文档](https://opencode.ai/docs/config/)
- [LM Studio 认证文档](https://lmstudio.ai/docs/developer/core/authentication)
- [LM Studio OpenAI 兼容端点](https://lmstudio.ai/docs/developer/openai-compat)
- [Xiaomi MiMo API 平台](https://platform.xiaomimimo.com/)
