import { reactive, watch } from 'vue'

/** 牌面主题：写实(默认,传统人物牌) / 卡通 / 精简(中央单一大花色) */
export type FaceTheme = 'realistic' | 'cartoon' | 'minimal'
/** 牌背设计 1-4 */
export type CardBack = 1 | 2 | 3 | 4
/** 牌面大小 */
export type CardSize = 'small' | 'medium' | 'large'

export interface Appearance {
  faceTheme: FaceTheme
  cardBack: CardBack
  cardSize: CardSize
}

const STORAGE_KEY = 'spider-appearance'

const defaults: Appearance = {
  faceTheme: 'realistic',
  cardBack: 1,
  cardSize: 'medium'
}

function load(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw) as Partial<Appearance>
    return { ...defaults, ...parsed }
  } catch {
    return { ...defaults }
  }
}

const appearance = reactive<Appearance>(load())

/** 将当前外观同步到 <html> 的 data-* 属性，供全局 CSS 选择器使用 */
function apply() {
  const el = document.documentElement
  el.dataset.face = appearance.faceTheme
  el.dataset.back = String(appearance.cardBack)
  el.dataset.size = appearance.cardSize
}

watch(appearance, () => {
  apply()
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appearance))
  } catch {
    /* ignore */
  }
})

apply()

export function useAppearance() {
  return appearance
}
