# Vercel 部署指南

本指南详细说明如何将 ZenAI Todo 应用部署到 Vercel 平台。

## 前提条件

- Vercel 账户
- GitHub/GitLab/Bitbucket 账户（用于代码托管）
- Supabase 项目（已配置好数据库表结构）
- Node.js 环境（本地开发和构建）

## 项目结构调整

在部署到 Vercel 之前，需要对项目结构进行一些调整，以适应 Vercel 的部署模型。

### 1. 分离前端和后端

Vercel 推荐将前端和后端分离为不同的项目或目录。我们将保持当前的目录结构，但需要进行一些配置调整。

### 2. 创建 Vercel 配置文件

在项目根目录创建 `vercel.json` 文件，配置 Vercel 的部署行为。

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "backend/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "backend/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "index.html"
    }
  ]
}
```

## 前端部署

### 1. 构建前端应用

在本地构建前端应用，确保构建产物正确生成。

```bash
npm run build
```

这将在 `dist` 目录中生成静态构建文件。

### 2. 调整 API 基础 URL

在 `App.tsx` 文件中，将 API 基础 URL 调整为相对路径或 Vercel 部署后的域名。

```javascript
// 从
const API_BASE_URL = 'http://localhost:3001/api';

// 改为
const API_BASE_URL = '/api';
```

### 3. 部署到 Vercel

#### 方法一：通过 Vercel CLI 部署

1. 安装 Vercel CLI：

```bash
npm install -g vercel
```

2. 登录 Vercel：

```bash
vercel login
```

3. 部署项目：

```bash
vercel
```

按照提示完成部署配置。

#### 方法二：通过 Vercel 控制台部署

1. 登录 Vercel 控制台
2. 点击 "New Project"
3. 选择从 GitHub/GitLab/Bitbucket 导入项目
4. 选择您的仓库
5. 配置部署选项：
   - Framework Preset: React
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: 见下文

## 后端部署

Vercel 支持通过 Serverless Functions 部署后端代码。我们的后端代码已经按照 Vercel 的要求进行了配置。

### 1. 调整后端代码

确保后端代码兼容 Vercel 的 Serverless Functions 环境：

1. 确保所有依赖都在 `package.json` 中正确声明
2. 确保代码使用相对路径导入模块
3. 确保端口配置兼容 Vercel 环境

### 2. 环境变量配置

在 Vercel 控制台中，为项目添加以下环境变量：

| 环境变量 | 描述 | 示例值 |
|---------|------|--------|
| SUPABASE_URL | Supabase 项目 URL | https://your-project.supabase.co |
| SUPABASE_ANON_KEY | Supabase 匿名密钥 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 服务角色密钥 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... |
| NODE_ENV | 运行环境 | production |

## Supabase 配置

确保 Supabase 项目已正确配置：

1. **创建数据库表**：
   - 登录 Supabase 控制台
   - 进入 SQL Editor
   - 执行 `backend/init.sql` 文件中的 SQL 语句

2. **配置 API 密钥**：
   - 在 Supabase 控制台中，进入 "Settings" > "API"
   - 复制 "Project URL"、"Anon public" 和 "Service role" 密钥
   - 将这些值添加到 Vercel 项目的环境变量中

3. **配置 CORS**：
   - 在 Supabase 控制台中，进入 "Settings" > "API"
   - 在 "Allowed Origins" 中添加 Vercel 部署后的域名
   - 例如：`https://your-project.vercel.app`

## 部署验证

部署完成后，验证应用是否正常运行：

1. **访问应用**：
   - 打开 Vercel 部署后的 URL（例如：`https://your-project.vercel.app`）
   - 尝试登录并创建待办事项

2. **验证 API 端点**：
   - 访问 `https://your-project.vercel.app/api` 验证后端服务是否正常运行
   - 尝试调用其他 API 端点，确保它们都能正常响应

3. **验证数据库连接**：
   - 创建新的待办事项，确保它们能正确保存到数据库
   - 刷新页面，确保待办事项能正确加载

## 常见问题排查

### 1. API 调用失败

- 检查 Vercel 项目的环境变量是否正确配置
- 检查 Supabase 项目的 CORS 设置是否包含 Vercel 部署后的域名
- 查看 Vercel 控制台中的函数日志，了解具体错误信息

### 2. 数据库连接失败

- 检查 Supabase 密钥是否正确配置
- 检查 Supabase 项目的状态是否正常
- 验证数据库表结构是否已正确创建

### 3. 构建失败

- 检查 `package.json` 中的依赖是否正确
- 确保构建命令 `npm run build` 能在本地成功执行
- 查看 Vercel 控制台中的构建日志，了解具体错误信息

## 性能优化

为了获得最佳的部署性能：

1. **启用 Vercel 边缘网络**：
   - 在 `vercel.json` 中配置边缘网络

2. **优化静态资源**：
   - 确保前端构建产物已正确压缩
   - 使用 Vercel 的静态资源缓存

3. **优化数据库查询**：
   - 确保数据库表已创建适当的索引
   - 避免不必要的数据库查询

## 持续集成/持续部署 (CI/CD)

Vercel 自动支持从 GitHub/GitLab/Bitbucket 仓库进行 CI/CD：

1. 每当您推送到主分支时，Vercel 会自动构建和部署您的应用
2. 您可以创建预览环境，为每个 Pull Request 生成部署预览

## 总结

通过本指南，您应该能够成功将 ZenAI Todo 应用部署到 Vercel 平台。Vercel 提供了简单而强大的部署体验，使您的应用能够快速上线并保持高可用性。

如果您在部署过程中遇到任何问题，请参考 Vercel 官方文档或 Supabase 官方文档获取更多帮助。