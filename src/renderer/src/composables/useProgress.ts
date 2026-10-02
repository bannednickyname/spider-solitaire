import { computed, reactive, ref } from 'vue'
import type { Difficulty, GameState } from '@shared/types'

export type GameMode = 'free' | 'campaign'

/** 未完成对局的存档 */
export interface SaveData {
  mode: GameMode
  level: number
  /** 开局时确定的难度（关卡模式下由关卡推导，重开/结算用） */
  originalDifficulty?: Difficulty
  /** 对局所属玩家 */
  player?: string
  state: GameState
  savedAt: number
}

export const SAVE_KEY = 'spider-save'

/** 通关经验：难度越高经验越多（仅内部结算用） */
const XP_PER_WIN: Record<Difficulty, number> = { 1: 100, 2: 250, 4: 600 }

/** Lv n → n+1 所需经验：400/800/1200… 逐级递增 */
function xpNeeded(level: number): number {
  return level * 400
}

/**
 * 关卡难度曲线（由易到难）：
 * 1-3 关 1 花色（快速上手，建立信心）→ 4-9 关 2 花色（进阶学习跨花色排序）→ 10 关起 4 花色（完整经典挑战）
 */
export function campaignDifficulty(level: number): Difficulty {
  if (level <= 3) return 1
  if (level <= 9) return 2
  return 4
}

interface ProgressData {
  xp: number
  campaignLevel: number
  /** 跨局累计积分：每局结算时把本局最终积分计入 */
  totalScore: number
}

const LEGACY_PROGRESS_KEY = 'spider-progress'
const LAST_PLAYER_KEY = 'spider-last-player'

function keyFor(name: string): string {
  return `spider-progress:${name}`
}

/** 加载某玩家的进度；无记录时尝试继承旧版全局存档，否则重置 */
function loadFor(name: string): ProgressData {
  try {
    const raw = localStorage.getItem(keyFor(name))
    if (raw) {
      const d = JSON.parse(raw) as Partial<ProgressData>
      return {
        xp: typeof d.xp === 'number' && d.xp >= 0 ? d.xp : 0,
        campaignLevel:
          typeof d.campaignLevel === 'number' && d.campaignLevel >= 1 ? d.campaignLevel : 1,
        totalScore: typeof d.totalScore === 'number' && d.totalScore >= 0 ? d.totalScore : 0
      }
    }
    // 兼容旧版无玩家名的存档：首个玩家继承
    const legacy = localStorage.getItem(LEGACY_PROGRESS_KEY)
    if (legacy) {
      const d = JSON.parse(legacy) as Partial<ProgressData>
      return {
        xp: typeof d.xp === 'number' && d.xp >= 0 ? d.xp : 0,
        campaignLevel:
          typeof d.campaignLevel === 'number' && d.campaignLevel >= 1 ? d.campaignLevel : 1,
        totalScore: typeof d.totalScore === 'number' && d.totalScore >= 0 ? d.totalScore : 0
      }
    }
  } catch {
    /* 损坏则重置 */
  }
  return { xp: 0, campaignLevel: 1, totalScore: 0 }
}

/** 当前玩家名（空串 = 尚未起名） */
const playerName = ref<string>(localStorage.getItem(LAST_PLAYER_KEY) ?? '')

const data = reactive<ProgressData>(
  playerName.value ? loadFor(playerName.value) : { xp: 0, campaignLevel: 1, totalScore: 0 }
)

function persist(): void {
  if (!playerName.value) return
  localStorage.setItem(
    keyFor(playerName.value),
    JSON.stringify({ xp: data.xp, campaignLevel: data.campaignLevel, totalScore: data.totalScore })
  )
}

/** 设定/切换玩家：加载该玩家的关卡与经验档案 */
function setPlayer(name: string): void {
  const n = name.trim() || '玩家'
  playerName.value = n
  localStorage.setItem(LAST_PLAYER_KEY, n)
  Object.assign(data, loadFor(n))
  persist()
}

/** 查看某玩家的进度（不切换当前玩家）；无记录返回 null */
function peekPlayer(name: string): ProgressData | null {
  try {
    const raw = localStorage.getItem(keyFor(name.trim()))
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<ProgressData>
    return {
      xp: typeof d.xp === 'number' && d.xp >= 0 ? d.xp : 0,
      campaignLevel:
        typeof d.campaignLevel === 'number' && d.campaignLevel >= 1 ? d.campaignLevel : 1,
      totalScore: typeof d.totalScore === 'number' && d.totalScore >= 0 ? d.totalScore : 0
    }
  } catch {
    return null
  }
}

export function useProgress() {
  /** 由总经验推导玩家等级与当前级进度 */
  const playerLevel = computed(() => {
    let level = 1
    let remaining = data.xp
    while (remaining >= xpNeeded(level)) {
      remaining -= xpNeeded(level)
      level++
    }
    return { level, current: remaining, next: xpNeeded(level) }
  })

  /** 胜利结算：按难度加经验，返回本次获得量与是否升级 */
  function addWin(difficulty: Difficulty): { xpGained: number; leveledUp: boolean; level: number } {
    const before = playerLevel.value.level
    const xpGained = XP_PER_WIN[difficulty]
    data.xp += xpGained
    persist()
    const after = playerLevel.value.level
    return { xpGained, leveledUp: after > before, level: after }
  }

  /** 关卡模式通关：进入下一关 */
  function advanceCampaign(): void {
    data.campaignLevel++
    persist()
  }

  /** 对局结算：把本局最终积分计入累计积分，返回累计值 */
  function addScore(score: number): number {
    data.totalScore += Math.max(0, score)
    persist()
    return data.totalScore
  }

  /** 读取未完成对局的存档；不存在或结构损坏时返回 null */
  function readSave(): SaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (!raw) return null
      const d = JSON.parse(raw) as SaveData
      if (!d || !d.state || !Array.isArray(d.state.tableau) || d.state.tableau.length !== 10) {
        return null
      }
      return d
    } catch {
      return null
    }
  }

  /** 清除未完成对局的存档 */
  function clearSave(): void {
    localStorage.removeItem(SAVE_KEY)
  }

  return {
    data,
    playerName,
    setPlayer,
    peekPlayer,
    addWin,
    addScore,
    advanceCampaign,
    readSave,
    clearSave
  }
}
