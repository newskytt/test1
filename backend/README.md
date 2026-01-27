# ZenAI Todo Backend

这是 ZenAI Todo 应用的后端服务，使用 Express.js 和 Supabase 构建。

## 功能特性

- 用户认证和管理
- 待办事项的 CRUD 操作
- 子任务管理
- AI 辅助功能（任务优先级建议、任务分解、励志名言）

## 技术栈

- Node.js
- Express.js
- Supabase (PostgreSQL)
- CORS
- Dotenv

## 快速开始

### 前提条件

- Node.js 14+ 已安装
- Supabase 项目已创建

### 安装步骤

1. **安装依赖**

```bash
npm install
```

2. **配置环境变量**

复制 `.env` 文件并填写您的 Supabase 配置：

```bash
cp .env.example .env
```

在 `.env` 文件中填写以下信息：

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 数据库设置

1. **登录 Supabase 控制台**

访问 [Supabase 控制台](https://app.supabase.io/) 并登录您的账户。

2. **创建项目**

如果您还没有项目，创建一个新的 Supabase 项目。

3. **获取 API 密钥**

在项目设置中，获取以下信息：
- Project URL
- Anon Public Key
- Service Role Key

4. **初始化数据库表**

运行数据库初始化脚本：

```bash
node database.js
```

这将创建必要的数据库表结构。

### 运行服务

**开发模式**

```bash
npm run dev
```

**生产模式**

```bash
npm start
```

服务将在 `http://localhost:3001` 上运行。

## API 端点

### 用户相关

- `POST /api/auth/login` - 用户登录/注册

### 待办事项相关

- `GET /api/todos/:username` - 获取用户的待办事项
- `POST /api/todos` - 创建新的待办事项
- `PUT /api/todos/:id` - 更新待办事项状态
- `DELETE /api/todos/:id` - 删除待办事项

### 子任务相关

- `POST /api/subtasks` - 创建新的子任务
- `PUT /api/subtasks/:id` - 更新子任务状态

### AI 相关

- `POST /api/ai/suggest` - 获取任务优先级和类别建议
- `POST /api/ai/decompose` - 将任务分解为子步骤
- `GET /api/ai/quote` - 获取励志名言

## 错误处理

所有 API 响应都包含 `success` 字段，表示操作是否成功。如果操作失败，响应将包含 `error` 字段，描述错误原因。

## 前端集成

前端应用应该将 API 基础 URL 设置为 `http://localhost:3001/api`，并使用上述 API 端点与后端交互。

## 许可证

ISC