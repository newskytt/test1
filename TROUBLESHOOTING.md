# 部署后数据存储问题解决方案

## 问题诊断
数据库连接正常，表已存在，但数据不存储的原因：

## 解决步骤

### 1. 在Vercel设置环境变量
1. 进入 Vercel 项目控制台
2. 点击 "Settings" → "Environment Variables"
3. 添加以下环境变量：
   ```
   SUPABASE_URL=https://mrebkbdeikvchciowdei.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=sb_secret_V1T-BmWCAe9rQi1GNd2ljg_Q-IzGYVC
   NODE_ENV=production
   ```

### 2. 重新部署
设置环境变量后，Vercel会自动重新部署，或手动触发部署。

### 3. 测试API
访问 `https://your-project.vercel.app/api` 确认API正常响应：
```json
{"message": "ZenAI Todo Backend is running!"}
```

### 4. 测试数据存储
在前端尝试创建新待办事项，然后检查：
- 前端是否显示成功消息
- 浏览器控制台是否有错误
- API调用是否成功

### 5. 调试步骤
如果仍有问题，检查：
1. 浏览器开发者工具的Network标签
2. Vercel Functions日志
3. Supabase日志

## 常见错误及解决方案

### 错误：CORS
- 确保在Supabase控制台的Authentication → Settings中添加Vercel域名

### 错误：环境变量未定义
- 确认Vercel环境变量名称完全匹配
- 重新部署项目使环境变量生效

### 错误：权限问题
- 确认使用了SERVICE_ROLE_KEY而不是ANON_KEY
- 检查RLS策略是否正确配置