import { reactive, ref, computed } from 'vue'
import type { Card, Difficulty, GameState, MoveRequest } from '@shared/types'
import { createDeck, shuffle, dealInitial } from './deck'
import { validateMove, canDealStock, canPickUp, canDropOn, findCompletedRun, checkWin } from './rules'

/** 深拷贝一份游戏状态快照（用于撤销栈） */
function cloneState(s: GameState): GameState {
  return JSON.parse(JSON.stringify(s)) as GameState
}

export function useGameStore() {
  const state = reactive<GameState>({
    difficulty: 1,
    tableau: [],
    stock: [],
    completed: [],
    score: 500,
    moves: 0,
    elapsedMs: 0
  })

  const history: GameState[] = []
  const won = ref(false)

  /** 被拖拽移动过的牌 ID，累积不清空（一局≤104张），
   *  避免 class 移除导致 animation 属性变化而重播入场动画 */
  const placedIds = ref<Set<string>>(new Set())

  function markPlaced(ids: string[]): void {
    if (ids.length === 0) return
    const next = new Set(placedIds.value)
    for (const id of ids) next.add(id)
    placedIds.value = next
  }

  /** 从 stock 发出过的牌 ID，累积不清空，理由同上 */
  const dealtIds = ref<Set<string>>(new Set())

  function markDealt(ids: string[]): void {
    if (ids.length === 0) return
    const next = new Set(dealtIds.value)
    for (const id of ids) next.add(id)
    dealtIds.value = next
  }

  const canUndo = computed(() => history.length > 0)
  const stockRoundsLeft = computed(() => state.stock.length)

  function newGame(difficulty: Difficulty): void {
    const deck = shuffle(createDeck(difficulty))
    const { tableau, stock } = dealInitial(deck)
    state.difficulty = difficulty
    state.tableau = tableau
    state.stock = stock
    state.completed = []
    state.score = 500
    state.moves = 0
    state.elapsedMs = 0
    history.length = 0
    won.value = false
    placedIds.value = new Set()
    dealtIds.value = new Set()
    hint.value = null
  }

  /** 翻开某列新顶牌（若为背面） */
  function flipTopIfNeeded(colIndex: number): void {
    const col = state.tableau[colIndex]
    if (col && col.cards.length > 0) {
      const top = col.cards[col.cards.length - 1]
      if (!top.faceUp) top.faceUp = true
    }
  }

  /** 扫描所有列，把底部 K→A 同花色完整序列移入 completed */
  function collectCompleted(): void {
    for (let i = 0; i < state.tableau.length; i++) {
      const col = state.tableau[i]
      const start = findCompletedRun(col)
      if (start >= 0) {
        const run = col.cards.splice(start)
        state.completed.push({ suit: run[0].suit, cards: run })
        state.score += 100
        flipTopIfNeeded(i)
      }
    }
    if (checkWin(state)) won.value = true
  }

  /** 执行一次移动：记录撤销快照、翻开源列顶牌、步数+1 分数-1，并检查完成序列 */
  function move(req: MoveRequest): boolean {
    const { ok } = validateMove(state, req)
    if (!ok) return false

    history.push(cloneState(state))

    const from = state.tableau[req.fromCol]
    const to = state.tableau[req.toCol]
    const movingCards = from.cards.splice(req.fromIndex)
    to.cards.push(...movingCards)

    markPlaced(movingCards.map((c) => c.id))

    flipTopIfNeeded(req.fromCol)
    state.moves++
    if (state.score > 0) state.score--

    hint.value = null
    collectCompleted()
    return true
  }

  /** 从 stock 发一轮牌（每列+1 张）：步数+1 分数-1，并检查完成序列 */
  function dealStock(): boolean {
    if (!canDealStock(state.tableau)) return false
    if (state.stock.length === 0) return false

    history.push(cloneState(state))

    const round = state.stock.shift()!
    const dealtCardIds: string[] = []
    for (let i = 0; i < state.tableau.length; i++) {
      const card = round[i]
      if (card) {
        card.faceUp = true
        state.tableau[i].cards.push(card)
        dealtCardIds.push(card.id)
      }
    }
    markDealt(dealtCardIds)
    state.moves++
    if (state.score > 0) state.score--

    hint.value = null
    collectCompleted()
    return true
  }

  /** 撤销最近一步：恢复快照（分数/步数一并回滚） */
  function undo(): boolean {
    if (history.length === 0) return false
    const prev = history.pop()!
    Object.assign(state, prev)
    won.value = false
    hint.value = null
    return true
  }

  /** 撤消全部：回到本局最初状态 */
  function undoAll(): boolean {
    if (history.length === 0) return false
    const first = history[0]
    history.length = 0
    Object.assign(state, first)
    won.value = false
    hint.value = null
    return true
  }

  /** 导出当前局面快照（用于断点续玩存档） */
  function serialize(): GameState {
    return cloneState(state)
  }

  /** 从存档恢复局面；历史与动画标记清空（恢复后不可撤销） */
  function restore(s: GameState): void {
    Object.assign(state, cloneState(s))
    history.length = 0
    won.value = false
    hint.value = null
    placedIds.value = new Set()
    dealtIds.value = new Set()
  }

  /** 提示状态：当前高亮的合法移动 */
  const hint = ref<{ fromCol: number; fromIndex: number; toCol: number } | null>(null)

  function clearHint(): void {
    hint.value = null
  }

  /** 找出当前所有合法移动 */
  function findHints(): { fromCol: number; fromIndex: number; toCol: number }[] {
    const cols = state.tableau
    const result: { fromCol: number; fromIndex: number; toCol: number }[] = []
    for (let fromCol = 0; fromCol < cols.length; fromCol++) {
      const col = cols[fromCol]
      for (let fromIndex = 0; fromIndex < col.cards.length; fromIndex++) {
        if (!canPickUp(col, fromIndex)) continue
        const movingCards = col.cards.slice(fromIndex)
        for (let toCol = 0; toCol < cols.length; toCol++) {
          if (toCol === fromCol) continue
          if (canDropOn(movingCards, cols[toCol])) {
            result.push({ fromCol, fromIndex, toCol })
          }
        }
      }
    }
    return result
  }

  /** 提示轮换游标：每次点击提示展示下一个合法移动 */
  let hintCursor = 0

  /** 触发提示：在所有合法移动间轮换高亮；若无合法移动则返回 false */
  function showHint(): boolean {
    const all = findHints()
    if (all.length === 0) {
      hint.value = null
      hintCursor = 0
      return false
    }
    // 当前提示仍在新列表中：从其后继续轮换；否则从头开始
    const cur = hint.value
    const idx = cur
      ? all.findIndex(
          (h) => h.fromCol === cur.fromCol && h.fromIndex === cur.fromIndex && h.toCol === cur.toCol
        )
      : -1
    hintCursor = idx >= 0 ? (idx + 1) % all.length : 0
    hint.value = all[hintCursor]
    return true
  }

  return {
    state,
    won,
    canUndo,
    stockRoundsLeft,
    placedIds,
    dealtIds,
    hint,
    newGame,
    move,
    dealStock,
    undo,
    undoAll,
    serialize,
    restore,
    showHint,
    clearHint
  }
}

export type GameStore = ReturnType<typeof useGameStore>
