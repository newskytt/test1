
import React, { useState, useEffect } from 'react';
import { Todo, Priority, SubTask, User } from './types';
import { TodoItem } from './components/TodoItem';
import { suggestTaskDetails, decomposeTask, getMotivationalQuote } from './services/geminiService';

// API基础URL
const API_BASE_URL = '/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('zen-auth');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [quote, setQuote] = useState<string>('');
  const [decomposingId, setDecomposingId] = useState<string | null>(null);
  const [loginName, setLoginName] = useState('');

  // Effect to load todos when user changes
  useEffect(() => {
    const loadTodos = async () => {
      if (currentUser) {
        try {
          const response = await fetch(`${API_BASE_URL}/todos/${currentUser.username}`);
          if (response.ok) {
            const data = await response.json();
            setTodos(data.todos || []);
          } else {
            // API调用失败，尝试从本地存储加载
            const saved = localStorage.getItem(`zen-todos-${currentUser.username}`);
            setTodos(saved ? JSON.parse(saved) : []);
          }
        } catch (error) {
          console.error('Load todos error:', error);
          // 网络错误，尝试从本地存储加载
          const saved = localStorage.getItem(`zen-todos-${currentUser.username}`);
          setTodos(saved ? JSON.parse(saved) : []);
        }
      } else {
        setTodos([]);
      }
    };

    loadTodos();
  }, [currentUser]);

  // 保存todos到本地存储作为备份
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`zen-todos-${currentUser.username}`, JSON.stringify(todos));
    }
  }, [todos, currentUser]);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        // 尝试从后端API获取
        const response = await fetch(`${API_BASE_URL}/ai/quote`);
        if (response.ok) {
          const data = await response.json();
          setQuote(data.quote || "专注于当下的每一个小胜利。");
        } else {
          // API调用失败，尝试使用本地Gemini API
          const q = await getMotivationalQuote();
          setQuote(q);
        }
      } catch (err) {
        console.error('Fetch quote error:', err);
        setQuote("专注于当下的每一个小胜利。");
      }
    };
    fetchQuote();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginName.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      const user = { username: loginName.trim() };
      setCurrentUser(user);
      localStorage.setItem('zen-auth', JSON.stringify(user));
    } catch (error) {
      console.error('Login error:', error);
      // 即使API调用失败，也允许本地登录
      const user = { username: loginName.trim() };
      setCurrentUser(user);
      localStorage.setItem('zen-auth', JSON.stringify(user));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('zen-auth');
  };

  const handleAddTodo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !currentUser) return;

    setIsAdding(true);
    const text = inputText;
    setInputText('');

    try {
      // 尝试从后端API获取AI建议
      let suggestion;
      try {
        const response = await fetch(`${API_BASE_URL}/ai/suggest`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        });
        
        if (response.ok) {
          const data = await response.json();
          suggestion = data.suggestion;
        } else {
          // API调用失败，使用本地Gemini API
          suggestion = await suggestTaskDetails(text);
        }
      } catch (error) {
        // 网络错误，使用本地Gemini API
        suggestion = await suggestTaskDetails(text);
      }
      
      // 尝试向后端API添加待办事项
      try {
        const response = await fetch(`${API_BASE_URL}/todos`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: currentUser.username,
            text,
            priority: suggestion.priority,
            category: suggestion.category
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const newTodo: Todo = {
            id: data.todo.id,
            text: data.todo.text,
            completed: data.todo.completed,
            priority: data.todo.priority,
            category: data.todo.category,
            createdAt: new Date(data.todo.created_at).getTime(),
            subTasks: []
          };
          setTodos(prev => [newTodo, ...prev]);
        } else {
          // API调用失败，使用本地创建
          const newTodo: Todo = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            priority: suggestion.priority,
            category: suggestion.category,
            createdAt: Date.now(),
            subTasks: []
          };
          setTodos(prev => [newTodo, ...prev]);
        }
      } catch (error) {
        console.error('Add todo error:', error);
        // 网络错误，使用本地创建
        const newTodo: Todo = {
          id: crypto.randomUUID(),
          text,
          completed: false,
          priority: suggestion.priority,
          category: suggestion.category,
          createdAt: Date.now(),
          subTasks: []
        };
        setTodos(prev => [newTodo, ...prev]);
      }
    } catch (error) {
      console.error('Handle add todo error:', error);
      // 所有方法都失败，使用默认值创建
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        priority: Priority.MEDIUM,
        category: "常规",
        createdAt: Date.now(),
        subTasks: []
      };
      setTodos(prev => [newTodo, ...prev]);
    } finally {
      setIsAdding(false);
    }
  };

  const toggleTodo = async (id: string) => {
    // 先更新本地状态，提供即时反馈
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const newCompleted = !todo.completed;
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: newCompleted } : t
    ));
    
    // 然后尝试更新后端API
    try {
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch (error) {
      console.error('Toggle todo error:', error);
      // 网络错误，保持本地状态不变
    }
  };

  const deleteTodo = async (id: string) => {
    // 先更新本地状态，提供即时反馈
    setTodos(prev => prev.filter(t => t.id !== id));
    
    // 然后尝试更新后端API
    try {
      await fetch(`${API_BASE_URL}/todos/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete todo error:', error);
      // 网络错误，保持本地状态不变
    }
  };

  const handleDecompose = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    setDecomposingId(id);
    try {
      // 尝试从后端API获取分解结果
      let steps;
      try {
        const response = await fetch(`${API_BASE_URL}/ai/decompose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: todo.text }),
        });
        
        if (response.ok) {
          const data = await response.json();
          steps = data.steps || [];
        } else {
          // API调用失败，使用本地Gemini API
          steps = await decomposeTask(todo.text);
        }
      } catch (error) {
        // 网络错误，使用本地Gemini API
        steps = await decomposeTask(todo.text);
      }
      
      const subTasks: SubTask[] = [];
      
      // 尝试向后端API添加子任务
      for (const step of steps) {
        try {
          const response = await fetch(`${API_BASE_URL}/subtasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ todo_id: id, text: step }),
          });
          
          if (response.ok) {
            const data = await response.json();
            subTasks.push({
              id: data.subtask.id,
              text: data.subtask.text,
              completed: data.subtask.completed
            });
          } else {
            // API调用失败，使用本地创建
            subTasks.push({
              id: crypto.randomUUID(),
              text: step,
              completed: false
            });
          }
        } catch (error) {
          // 网络错误，使用本地创建
          subTasks.push({
            id: crypto.randomUUID(),
            text: step,
            completed: false
          });
        }
      }

      setTodos(prev => prev.map(t => 
        t.id === id ? { ...t, subTasks } : t
      ));
    } catch (err) {
      console.error(err);
    } finally {
      setDecomposingId(null);
    }
  };

  const toggleSubtask = async (todoId: string, subtaskId: string) => {
    // 先更新本地状态，提供即时反馈
    const todo = todos.find(t => t.id === todoId);
    if (!todo || !todo.subTasks) return;
    
    const subtask = todo.subTasks.find(st => st.id === subtaskId);
    if (!subtask) return;
    
    const newCompleted = !subtask.completed;
    
    setTodos(prev => prev.map(t => {
      if (t.id === todoId && t.subTasks) {
        return {
          ...t,
          subTasks: t.subTasks.map(st => 
            st.id === subtaskId ? { ...st, completed: newCompleted } : st
          )
        };
      }
      return t;
    }));
    
    // 然后尝试更新后端API
    try {
      await fetch(`${API_BASE_URL}/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch (error) {
      console.error('Toggle subtask error:', error);
      // 网络错误，保持本地状态不变
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full glass p-8 rounded-3xl shadow-2xl border border-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 text-white rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">欢迎来到 ZenAI</h1>
            <p className="text-slate-500 mt-2">禅意待办，AI 助力您的效率提升</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 ml-1">您的称呼</label>
              <input
                type="text"
                required
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="请输入用户名..."
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              开启体验
            </button>
          </form>
          <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
            不同的用户名将拥有独立的待办列表，<br/>数据将安全保存在您的本地浏览器中。
          </p>
        </div>
      </div>
    );
  }

  const completedCount = todos.filter(t => t.completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 md:py-20">
      {/* User Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">当前用户</p>
            <p className="text-sm font-bold text-slate-700">{currentUser.username}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="text-xs font-semibold text-slate-400 hover:text-rose-500 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          退出登录
        </button>
      </div>

      {/* Header */}
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">禅意 AI 待办</h1>
        {quote && (
          <p className="text-slate-500 italic animate-in fade-in duration-700">“{quote}”</p>
        )}
      </header>

      {/* Progress Section */}
      <section className="mb-10 glass p-6 rounded-3xl border border-white shadow-xl">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">任务进度</h2>
            <p className="text-3xl font-bold text-slate-800">{completedCount} <span className="text-lg text-slate-400">/ {todos.length} 已完成</span></p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-indigo-600">{progressPercent}%</span>
          </div>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </section>

      {/* Input Section */}
      <form onSubmit={handleAddTodo} className="relative mb-8 group">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="今天想做点什么？AI 将协助您分类..."
          className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 pr-16 text-lg shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
          disabled={isAdding}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isAdding}
          className={`absolute right-3 top-3 bottom-3 px-4 rounded-xl flex items-center justify-center transition-all ${
            inputText.trim() && !isAdding 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {isAdding ? (
            <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
      </form>

      {/* List Section */}
      <div className="space-y-4">
        {todos.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
            <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-sm">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-400 font-medium text-lg">您的专注从这里开始。</p>
            <p className="text-slate-300 text-sm">添加任务，体验 AI 的智能协作。</p>
          </div>
        ) : (
          todos.map(todo => (
            <TodoItem 
              key={todo.id} 
              todo={todo} 
              onToggle={toggleTodo} 
              onDelete={deleteTodo}
              onDecompose={handleDecompose}
              onToggleSubtask={toggleSubtask}
              isDecomposing={decomposingId === todo.id}
            />
          ))
        )}
      </div>

      <footer className="mt-16 text-center text-slate-400 text-xs">
        由 Gemini AI 驱动 &bull; 智能任务管理系统
      </footer>
    </div>
  );
};

export default App;
