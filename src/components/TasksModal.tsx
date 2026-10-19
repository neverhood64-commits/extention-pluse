import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, RefreshCw, X, AlertTriangle, LogOut, Check } from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from '../services/googleAuth';
import {
  GoogleTaskItem,
  fetchTasks,
  createGoogleTask,
  updateGoogleTaskStatus,
  deleteGoogleTask,
} from '../services/googleTasks';

interface LocalTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TasksModalProps {
  isOpen: boolean;
  isDark: boolean;
  onClose: () => void;
}

interface PendingConfirmAction {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

const DEFAULT_LOCAL_TASKS: LocalTask[] = [
  { id: 'lt-1', title: 'بررسی پرونده‌های جدید در سامانه لایف پلاس', completed: false },
  { id: 'lt-2', title: 'استعلام دهک معیشتی متقاضیان نوبت صبح', completed: false },
  { id: 'lt-3', title: 'ثبت گزارش و پیگیری تیکت‌های پشتیبانی استان', completed: true },
];

export const TasksModal: React.FC<TasksModalProps> = ({ isOpen, isDark, onClose }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'google'>('local');
  const [localTasks, setLocalTasks] = useState<LocalTask[]>(() => {
    try {
      const saved = localStorage.getItem('mz7828_local_tasks');
      return saved ? JSON.parse(saved) : DEFAULT_LOCAL_TASKS;
    } catch {
      return DEFAULT_LOCAL_TASKS;
    }
  });
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Google Tasks state
  const [needsAuth, setNeedsAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [googleTasks, setGoogleTasks] = useState<GoogleTaskItem[]>([]);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Mandatory explicit confirmation dialog state for Google Tasks mutating/destructive operations
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirmAction | null>(null);
  const [isExecutingConfirm, setIsExecutingConfirm] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('mz7828_local_tasks', JSON.stringify(localTasks));
    } catch {
      // ignore storage errors
    }
  }, [localTasks]);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setNeedsAuth(false);
        setUserEmail(user.email);
        loadGoogleTasks();
      },
      () => {
        setNeedsAuth(true);
        setUserEmail(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadGoogleTasks = async () => {
    const token = await getAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }
    setIsLoadingGoogle(true);
    setGoogleError(null);
    try {
      const items = await fetchTasks();
      setGoogleTasks(items);
      setNeedsAuth(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'خطا در ارتباط با Google Tasks';
      if (message === 'NOT_AUTHENTICATED') {
        setNeedsAuth(true);
      } else {
        setGoogleError(message);
      }
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        setUserEmail(result.user.email);
        await loadGoogleTasks();
      }
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : 'ورود به حساب گوگل انجام نشد');
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setNeedsAuth(true);
    setUserEmail(null);
    setGoogleTasks([]);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    if (activeTab === 'local') {
      setLocalTasks((prev) => [
        { id: `lt-${Date.now()}`, title: trimmed, completed: false },
        ...prev,
      ]);
      setNewTaskTitle('');
    } else {
      try {
        setIsLoadingGoogle(true);
        const created = await createGoogleTask(trimmed);
        setGoogleTasks((prev) => [created, ...prev]);
        setNewTaskTitle('');
      } catch (err: unknown) {
        setGoogleError(err instanceof Error ? err.message : 'خطا در افزودن وظیفه');
      } finally {
        setIsLoadingGoogle(false);
      }
    }
  };

  // Request user confirmation before mutating Google Tasks status
  const requestToggleGoogleTask = (task: GoogleTaskItem) => {
    const nextCompleted = task.status !== 'completed';
    setPendingConfirm({
      title: nextCompleted ? 'تایید تکمیل وظیفه در Google Tasks' : 'بازگردانی وضعیت وظیفه در Google Tasks',
      description: `آیا مطمئن هستید که می‌خواهید وضعیت وظیفه «${task.title}» را در حساب Google Tasks خود تغییر دهید؟`,
      confirmLabel: 'بله، بروزرسانی شود',
      onConfirm: async () => {
        const updated = await updateGoogleTaskStatus(task.id, nextCompleted);
        setGoogleTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      },
    });
  };

  // Request user confirmation before deleting a Google Task
  const requestDeleteGoogleTask = (task: GoogleTaskItem) => {
    setPendingConfirm({
      title: 'حذف وظیفه از Google Tasks',
      description: `آیا از حذف دائمی وظیفه «${task.title}» از حساب Google Tasks خود اطمینان دارید؟ این عملیات قابل بازگشت نیست.`,
      confirmLabel: 'حذف وظیفه',
      onConfirm: async () => {
        await deleteGoogleTask(task.id);
        setGoogleTasks((prev) => prev.filter((t) => t.id !== task.id));
      },
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingConfirm) return;
    setIsExecutingConfirm(true);
    try {
      await pendingConfirm.onConfirm();
      setPendingConfirm(null);
    } catch (err: unknown) {
      setGoogleError(err instanceof Error ? err.message : 'خطا در انجام عملیات');
    } finally {
      setIsExecutingConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`relative w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${
          isDark
            ? 'bg-slate-900 border-white/15 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">مدیریت وظایف و پیگیری پرونده‌ها</h3>
              <p className="text-xs text-slate-400">لیست کارهای روزانه مرکز مثبت زندگی ۷۸۲۸ و Google Tasks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Tab Switcher */}
        <div
          className={`mt-4 grid grid-cols-2 gap-1 p-1 rounded-xl ${
            isDark ? 'bg-slate-950/70' : 'bg-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'local'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            یادداشت‌های سریع مرکز ({localTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('google')}
            className={`py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'google'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            همگام‌سازی Google Tasks
          </button>
        </div>

        {/* Content Body */}
        {activeTab === 'local' ? (
          <div className="mt-4">
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="ثبت پیگیری جدید (مثلاً: بررسی پرونده اشتغال...)"
                className={`flex-1 px-3.5 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-950 border-white/15 text-slate-100 focus:border-emerald-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-600'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن</span>
              </button>
            </form>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {localTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setLocalTasks((prev) =>
                        prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
                      )
                    }
                    className="flex items-center gap-2.5 flex-1 text-right cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5" />}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        task.completed ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalTasks((prev) => prev.filter((t) => t.id !== task.id))}
                    className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {needsAuth ? (
              <div className="py-8 flex flex-col items-center text-center gap-4">
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                  برای مشاهده و مدیریت وظایف روزانه خود در سرویس Google Tasks، با حساب گوگل خود وارد شوید:
                </p>

                {/* Official Google Sign-In Button per workspace-integration skill */}
                <button type="button" onClick={handleGoogleLogin} className="gsi-material-button">
                  <div className="gsi-material-button-state"></div>
                  <div className="gsi-material-button-content-wrapper">
                    <div className="gsi-material-button-icon">
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        style={{ display: 'block' }}
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        ></path>
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        ></path>
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        ></path>
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        ></path>
                        <path fill="none" d="M0 0h48v48H0z"></path>
                      </svg>
                    </div>
                    <span className="gsi-material-button-contents">Sign in with Google</span>
                  </div>
                </button>

                {googleError && <p className="text-xs text-rose-400">{googleError}</p>}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
                  <span>حساب متصل: {userEmail || 'کاربر گوگل'}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadGoogleTasks}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 cursor-pointer"
                      title="بروزرسانی لیست"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGoogle ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={handleGoogleLogout}
                      className="flex items-center gap-1 text-rose-400 hover:underline cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>خروج</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="افزودن وظیفه مستقیم به Google Tasks..."
                    className={`flex-1 px-3.5 py-2 rounded-xl text-xs border outline-none ${
                      isDark
                        ? 'bg-slate-950 border-white/15 text-slate-100'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={isLoadingGoogle}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    ثبت در گوگل
                  </button>
                </form>

                {googleError && <p className="text-xs text-rose-400 mb-2">{googleError}</p>}

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {googleTasks.length === 0 && !isLoadingGoogle ? (
                    <p className="text-center text-xs text-slate-500 py-6">
                      هیچ وظیفه‌ای در لیست پیش‌فرض Google Tasks یافت نشد.
                    </p>
                  ) : (
                    googleTasks.map((task) => {
                      const isDone = task.status === 'completed';
                      return (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${
                            isDark ? 'bg-slate-950/60 border-white/10' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => requestToggleGoogleTask(task)}
                            className="flex items-center gap-2.5 flex-1 text-right cursor-pointer"
                          >
                            <span
                              className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'border-slate-500'
                              }`}
                            >
                              {isDone && <Check className="w-3.5 h-3.5" />}
                            </span>
                            <span className={`text-xs ${isDone ? 'line-through text-slate-500' : ''}`}>
                              {task.title}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDeleteGoogleTask(task)}
                            className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mandatory Explicit Confirmation Modal for Google Tasks Mutating/Destructive Calls */}
        {pendingConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
            <div
              className={`w-full max-w-md rounded-2xl border p-5 shadow-2xl ${
                isDark ? 'bg-slate-900 border-white/20 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5 text-amber-400 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="text-sm font-bold">{pendingConfirm.title}</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-5">
                {pendingConfirm.description}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isExecutingConfirm}
                  onClick={() => setPendingConfirm(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isExecutingConfirm}
                  onClick={executeConfirmedAction}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  {isExecutingConfirm ? 'در حال انجام...' : pendingConfirm.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
