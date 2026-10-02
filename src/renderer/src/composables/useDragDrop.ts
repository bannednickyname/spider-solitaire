import { ref, computed } from 'vue'
import gsap from 'gsap'
import type { Card } from '@shared/types'
import { canPickUp, validateMove } from '@renderer/game/rules'
import type { GameStore } from '@renderer/game/store'
import { useToast } from './useToast'
import { useSound } from './useSound'

/** 拖拽阶段（模块内部使用） */
type DragPhase = 'dragging' | 'snapping' | 'invalid'

const FACE_UP_STEP = 28
const FACE_DOWN_STEP = 14

/**
 * Pointer Events + GSAP 拖拽：直接操作被拖牌的真实 DOM transform，
 * 不经过 Vue 响应式，保证跟手即时。
 * - 合法落点：GSAP 过渡吸附到目标列后提交移动
 * - 非法落点：GSAP 晃动 + 屏幕震动，然后归位
 */
export function useDragDrop(store: GameStore) {
  const drag = ref<{ fromCol: number; fromIndex: number; movingCards: Card[] } | null>(null)
  const phase = ref<DragPhase | null>(null)
  const screenShake = ref(false)
  const { add: toast } = useToast()
  const sound = useSound()

  const isDragging = computed(() => !!drag.value)

  /** 抓取时指针的屏幕坐标 */
  let grabClientX = 0
  let grabClientY = 0
  /** 当前指针位移 */
  let curDx = 0
  let curDy = 0

  /** 被拖牌的真实 DOM 元素 */
  let draggingEls: HTMLElement[] = []

  let shakeTimer: ReturnType<typeof setTimeout> | null = null

  function triggerScreenShake() {
    if (shakeTimer) clearTimeout(shakeTimer)
    screenShake.value = false
    requestAnimationFrame(() => {
      screenShake.value = true
      shakeTimer = setTimeout(() => {
        screenShake.value = false
      }, 420)
    })
  }

  function findTargetColumn(clientX: number, clientY: number): number {
    const cols = document.querySelectorAll<HTMLElement>('[data-col-index]')
    if (cols.length === 0) return -1
    let best = -1
    let bestScore = Infinity
    cols.forEach((el) => {
      const rect = el.getBoundingClientRect()
      const dx =
        clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0
      const dy = clientY < rect.top ? rect.top - clientY : 0
      const score = dx + dy * 3
      if (score < bestScore) {
        bestScore = score
        best = Number(el.dataset.colIndex)
      }
    })
    return best
  }

  /** 计算被拖第一张牌吸附到目标列时的位移 */
  function computeSnapDelta(toCol: number): { dx: number; dy: number } | null {
    const d = drag.value
    if (!d) return null
    const srcColEl = document.querySelector<HTMLElement>(`[data-col-index="${d.fromCol}"]`)
    const dstColEl = document.querySelector<HTMLElement>(`[data-col-index="${toCol}"]`)
    if (!srcColEl || !dstColEl) return null
    const srcRect = srcColEl.getBoundingClientRect()
    const dstRect = dstColEl.getBoundingClientRect()

    const srcCards = store.state.tableau[d.fromCol].cards
    let srcTop = 0
    for (let i = 0; i < d.fromIndex; i++) {
      srcTop += srcCards[i].faceUp ? FACE_UP_STEP : FACE_DOWN_STEP
    }

    const dstCards = store.state.tableau[toCol].cards
    let dstTop = 0
    for (const c of dstCards) {
      dstTop += c.faceUp ? FACE_UP_STEP : FACE_DOWN_STEP
    }

    return {
      dx: dstRect.left - srcRect.left,
      dy: dstRect.top + dstTop - (srcRect.top + srcTop)
    }
  }

  function clearDrag() {
    if (draggingEls.length) {
      gsap.killTweensOf(draggingEls)
      gsap.set(draggingEls, { clearProps: 'transform' })
      draggingEls.forEach((el) => {
        el.classList.remove('dragging', 'drag-shake')
      })
    }
    draggingEls = []
    drag.value = null
    phase.value = null
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', endDrag)
    window.removeEventListener('pointercancel', endDrag)
  }

  function applyTransform(dx: number, dy: number) {
    gsap.set(draggingEls, { x: dx, y: dy })
  }

  function onPointerMove(e: PointerEvent) {
    if (phase.value !== 'dragging') return
    curDx = e.clientX - grabClientX
    curDy = e.clientY - grabClientY
    applyTransform(curDx, curDy)
  }

  function endDrag(e: PointerEvent) {
    if (!drag.value) return
    const d = drag.value
    const toCol = findTargetColumn(e.clientX, e.clientY)

    const req = { fromCol: d.fromCol, fromIndex: d.fromIndex, toCol }
    const valid =
      toCol >= 0 &&
      toCol !== d.fromCol &&
      validateMove(store.state, req).ok

    if (valid) {
      const snap = computeSnapDelta(toCol)
      phase.value = 'snapping'
      if (snap && draggingEls.length) {
        gsap.to(draggingEls, {
          x: snap.dx,
          y: snap.dy,
          duration: 0.24,
          ease: 'power3.out',
          overwrite: 'auto'
        })
      }
      setTimeout(() => {
        store.move(req)
        sound.move()
        clearDrag()
      }, 260)
    } else {
      // 非法：GSAP 晃动动画，然后归位
      phase.value = 'invalid'
      triggerScreenShake()
      toast('无法放置在此处', 'error')
      sound.error()
      if (draggingEls.length) {
        gsap.to(draggingEls, {
          keyframes: [
            { x: curDx - 10, rotation: -2, duration: 0.08 },
            { x: curDx + 10, rotation: 2, duration: 0.08 },
            { x: curDx - 8, rotation: -1, duration: 0.08 },
            { x: curDx + 8, rotation: 1, duration: 0.08 },
            { x: curDx, y: curDy, rotation: 0, duration: 0.1 }
          ],
          ease: 'none',
          overwrite: 'auto'
        })
      }
      setTimeout(() => {
        clearDrag()
      }, 460)
    }
  }

  function startDrag(
    fromCol: number,
    fromIndex: number,
    e: PointerEvent,
    cardEl: HTMLElement
  ): void {
    if (e.button !== undefined && e.button !== 0) return
    const col = store.state.tableau[fromCol]
    if (!col || !canPickUp(col, fromIndex)) return

    e.preventDefault()
    if (cardEl.setPointerCapture) {
      try {
        cardEl.setPointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    // 收集被拖牌的真实 DOM：从点击的那张开始到列尾
    const allCards = cardEl.parentElement?.querySelectorAll<HTMLElement>('.card-enter')
    if (!allCards) return
    draggingEls = Array.from(allCards).slice(fromIndex)
    if (draggingEls.length === 0) return

    // 提升层级、禁用指针事件
    draggingEls.forEach((el) => el.classList.add('dragging'))

    grabClientX = e.clientX
    grabClientY = e.clientY
    curDx = 0
    curDy = 0

    drag.value = {
      fromCol,
      fromIndex,
      movingCards: col.cards.slice(fromIndex)
    }
    phase.value = 'dragging'

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  return { drag, isDragging, phase, screenShake, startDrag }
}
