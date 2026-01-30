-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 创建待办事项表
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority VARCHAR(50) NOT NULL,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_todos_username ON todos(username);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);

-- 创建子任务表
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  todo_id UUID NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);

-- 为表启用RLS（行级安全）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);

CREATE POLICY "Users can view their own todos" ON todos FOR SELECT USING (true);
CREATE POLICY "Users can insert their own todos" ON todos FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own todos" ON todos FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own todos" ON todos FOR DELETE USING (true);

CREATE POLICY "Users can view their own subtasks" ON subtasks FOR SELECT USING (true);
CREATE POLICY "Users can insert their own subtasks" ON subtasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own subtasks" ON subtasks FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own subtasks" ON subtasks FOR DELETE USING (true);

-- 插入示例数据
INSERT INTO users (username) VALUES ('demo') ON CONFLICT (username) DO NOTHING;

INSERT INTO todos (username, text, priority, category) VALUES 
('demo', '完成项目报告', '高', '工作'),
('demo', '购买生日礼物', '中', '个人'),
('demo', '锻炼身体', '低', '健康')
ON CONFLICT DO NOTHING;