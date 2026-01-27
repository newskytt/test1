const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 创建Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 初始化数据库表结构
async function initDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // 创建用户表
    const { error: userTableError } = await supabase
      .rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
          );
          
          -- 创建索引
          CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        `
      });
    
    if (userTableError) {
      console.error('Error creating users table:', userTableError);
      return;
    }
    
    console.log('Users table created successfully');
    
    // 创建待办事项表
    const { error: todoTableError } = await supabase
      .rpc('execute_sql', {
        sql: `
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
        `
      });
    
    if (todoTableError) {
      console.error('Error creating todos table:', todoTableError);
      return;
    }
    
    console.log('Todos table created successfully');
    
    // 创建子任务表
    const { error: subtaskTableError } = await supabase
      .rpc('execute_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS subtasks (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            todo_id UUID NOT NULL,
            text TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (todo_id) REFERENCES todos(id) ON DELETE CASCADE
          );
          
          -- 创建索引
          CREATE INDEX IF NOT EXISTS idx_subtasks_todo_id ON subtasks(todo_id);
        `
      });
    
    if (subtaskTableError) {
      console.error('Error creating subtasks table:', subtaskTableError);
      return;
    }
    
    console.log('Subtasks table created successfully');
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// 导出函数
module.exports = { initDatabase };

// 如果直接运行此文件，则执行初始化
if (require.main === module) {
  initDatabase();
}