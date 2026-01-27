
import React from 'react';
import { Todo, SubTask } from '../types';
import { PriorityBadge } from './PriorityBadge';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onDecompose: (id: string) => void;
  onToggleSubtask: (todoId: string, subtaskId: string) => void;
  isDecomposing?: boolean;
}

export const TodoItem: React.FC<TodoItemProps> = ({ 
  todo, 
  onToggle, 
  onDelete, 
  onDecompose, 
  onToggleSubtask,
  isDecomposing 
}) => {
  return (
    <div className={`group relative bg-white rounded-xl p-4 shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md ${todo.completed ? 'bg-slate-50' : ''}`}>
      <div className="flex items-start gap-4">
        <button 
          onClick={() => onToggle(todo.id)}
          className={`mt-1 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completed ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 hover:border-indigo-400'
          }`}
        >
          {todo.completed && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className={`text-lg font-medium transition-all ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
              {todo.text}
            </h3>
            <PriorityBadge priority={todo.priority} />
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
              {todo.category}
            </span>
          </div>

          {!todo.completed && (!todo.subTasks || todo.subTasks.length === 0) && (
            <button
              onClick={() => onDecompose(todo.id)}
              disabled={isDecomposing}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {isDecomposing ? (
                <span className="flex items-center gap-1 animate-pulse">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  思考中...
                </span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 智能拆解
                </>
              )}
            </button>
          )}

          {todo.subTasks && todo.subTasks.length > 0 && (
            <div className="mt-4 space-y-2 border-l-2 border-slate-100 pl-4">
              {todo.subTasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={sub.completed} 
                    onChange={() => onToggleSubtask(todo.id, sub.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`text-sm ${sub.completed ? 'text-slate-400 line-through' : 'text-slate-600'}`}>
                    {sub.text}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={() => onDelete(todo.id)}
          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
          title="删除任务"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
