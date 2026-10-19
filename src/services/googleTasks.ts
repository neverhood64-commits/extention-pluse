import { getAccessToken } from './googleAuth';

export interface GoogleTaskItem {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string;
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
}

const TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

export async function fetchTaskLists(): Promise<GoogleTaskList[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const res = await fetch(`${TASKS_API_BASE}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!res.ok) {
    throw new Error('خطا در دریافت لیست‌های Google Tasks');
  }
  const data = await res.json();
  return data.items || [];
}

export async function fetchTasks(taskListId = '@default'): Promise<GoogleTaskItem[]> {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const res = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks?showCompleted=true&showHidden=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401 || res.status === 403) {
    throw new Error('NOT_AUTHENTICATED');
  }
  if (!res.ok) {
    throw new Error('خطا در دریافت وظایف از Google Tasks');
  }
  const data = await res.json();
  return data.items || [];
}

export async function createGoogleTask(
  title: string,
  notes?: string,
  taskListId = '@default'
): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const res = await fetch(`${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      notes: notes || 'ثبت شده در افزونه سامانه‌های اداری مراکز مثبت زندگی 7828 سیرجان',
    }),
  });

  if (!res.ok) {
    throw new Error('خطا در ایجاد وظیفه جدید در Google Tasks');
  }
  return await res.json();
}

export async function updateGoogleTaskStatus(
  taskId: string,
  completed: boolean,
  taskListId = '@default'
): Promise<GoogleTaskItem> {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const res = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: completed ? 'completed' : 'needsAction',
      }),
    }
  );

  if (!res.ok) {
    throw new Error('خطا در بروزرسانی وضعیت وظیفه');
  }
  return await res.json();
}

export async function deleteGoogleTask(taskId: string, taskListId = '@default'): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('NOT_AUTHENTICATED');

  const res = await fetch(
    `${TASKS_API_BASE}/lists/${encodeURIComponent(taskListId)}/tasks/${encodeURIComponent(taskId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('خطا در حذف وظیفه از Google Tasks');
  }
}
