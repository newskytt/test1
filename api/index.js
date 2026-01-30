import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// 创建Express应用
const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 检查环境变量
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
}

// 创建Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// 测试连接
app.get('/', (req, res) => {
  res.json({ 
    message: 'ZenAI Todo Backend is running!',
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'Set' : 'Missing',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing'
    }
  });
});

// 用户相关API
app.post('/api/auth/login', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  try {
    // 检查用户是否存在，不存在则创建
    let { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // 用户不存在，创建新用户
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([{ username }])
        .select()
        .single();
      
      if (createError) {
        throw createError;
      }
      
      user = newUser;
    } else if (error) {
      throw error;
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// 待办事项相关API
app.get('/api/todos/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const { data: todos, error } = await supabase
      .from('todos')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // 获取每个待办事项的子任务
    const todosWithSubTasks = await Promise.all(
      todos.map(async (todo) => {
        const { data: subTasks, error } = await supabase
          .from('subtasks')
          .select('*')
          .eq('todo_id', todo.id);
        
        if (error) {
          console.error('Error fetching subtasks:', error);
          return { ...todo, subTasks: [] };
        }
        
        return { ...todo, subTasks };
      })
    );
    
    res.json({ success: true, todos: todosWithSubTasks });
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to get todos' });
  }
});

app.post('/api/todos', async (req, res) => {
  const { username, text, priority, category } = req.body;
  
  if (!username || !text) {
    return res.status(400).json({ error: 'Username and text are required' });
  }
  
  try {
    const { data: todo, error } = await supabase
      .from('todos')
      .insert([{
        username,
        text,
        priority,
        category,
        completed: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, todo });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  
  try {
    const { data: todo, error } = await supabase
      .from('todos')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, todo });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    // 先删除相关的子任务
    await supabase
      .from('subtasks')
      .delete()
      .eq('todo_id', id);
    
    // 再删除待办事项
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// 子任务相关API
app.post('/api/subtasks', async (req, res) => {
  const { todo_id, text } = req.body;
  
  if (!todo_id || !text) {
    return res.status(400).json({ error: 'Todo ID and text are required' });
  }
  
  try {
    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert([{
        todo_id,
        text,
        completed: false
      }])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, subtask });
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

app.put('/api/subtasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  
  try {
    const { data: subtask, error } = await supabase
      .from('subtasks')
      .update({ completed })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    res.json({ success: true, subtask });
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// AI相关API
app.post('/api/ai/suggest', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    // 这里可以集成Gemini API
    // 暂时返回模拟数据
    const suggestion = {
      priority: '中',
      category: '工作',
      reason: '这是一个需要适度关注的任务'
    };
    
    res.json({ success: true, suggestion });
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ error: 'Failed to get AI suggestion' });
  }
});

app.post('/api/ai/decompose', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  
  try {
    // 这里可以集成Gemini API
    // 暂时返回模拟数据
    const steps = [
      '第一步：分析任务需求',
      '第二步：制定实施计划',
      '第三步：执行任务',
      '第四步：检查结果'
    ];
    
    res.json({ success: true, steps });
  } catch (error) {
    console.error('AI decomposition error:', error);
    res.status(500).json({ error: 'Failed to decompose task' });
  }
});

app.get('/api/ai/quote', async (req, res) => {
  try {
    // 这里可以集成Gemini API
    // 暂时返回模拟数据
    const quotes = [
      '专注于当下的每一个小胜利。',
      '今天的努力，明天的收获。',
      '成功源于坚持，放弃源于动摇。',
      '每一个挑战都是成长的机会。',
      '用心做好每一件事，成功自然会来。'
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    
    res.json({ success: true, quote: randomQuote });
  } catch (error) {
    console.error('AI quote error:', error);
    res.status(500).json({ error: 'Failed to get motivational quote' });
  }
});

// Vercel Serverless Function导出
export default app;