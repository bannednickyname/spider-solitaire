import { ref } from 'vue'

/** 通知类型与条目结构（模块内部使用） */
type ToastType = 'error' | 'info' | 'success'

interface Toast {
  id: number
  message: string
  type: ToastType
}

/** 模块级单例：任意组件可调用 useToast() 共享同一份通知列表 */
const toasts = ref<Toast[]>([])
let nextId = 0

export function useToast() {
  /** 新增通知并返回 id；默认 3.2s 自动消失 */
  function add(message: string, type: ToastType = 'error', durationMs?: number): number {
    const id = ++nextId
    toasts.value.push({ id, message, type })
    // 自动消失（默认 3.2s，可覆盖）
    setTimeout(() => remove(id), durationMs ?? 3200)
    return id
  }

  /** 按 id 移除通知 */
  function remove(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, add, remove }
}
