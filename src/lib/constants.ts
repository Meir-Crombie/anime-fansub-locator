export const TRANSLATION_STATUSES = [
  { value: 'ongoing',   label: 'בתרגום',   labelEn: 'Ongoing',   color: 'yellow' },
  { value: 'completed', label: 'הושלם',    labelEn: 'Completed', color: 'green'  },
  { value: 'dropped',   label: 'הופסק',    labelEn: 'Dropped',   color: 'red'    },
] as const

export const PLATFORMS = [
  { value: 'website',  label: 'אתר',       icon: 'Globe'    },
  { value: 'telegram', label: 'טלגרם',     icon: 'Send'     },
  { value: 'discord',  label: 'דיסקורד',   icon: 'MessageSquare' },
  { value: 'youtube',  label: 'יוטיוב',    icon: 'Youtube'  },
] as const

export const GENRES = [
  { value: 'action',    label: 'אקשן' },
  { value: 'adventure', label: 'הרפתקאות' },
  { value: 'comedy',    label: 'קומדיה' },
  { value: 'drama',     label: 'דרמה' },
  { value: 'fantasy',   label: 'פנטזיה' },
  { value: 'horror',    label: 'אימה' },
  { value: 'isekai',    label: 'איסקאי' },
  { value: 'mecha',     label: 'מכה' },
  { value: 'music',     label: 'מוזיקה' },
  { value: 'mystery',   label: 'מסתורין' },
  { value: 'psychological', label: 'פסיכולוגי' },
  { value: 'romance',   label: 'רומנטיקה' },
  { value: 'sci-fi',    label: 'מדע בדיוני' },
  { value: 'slice-of-life', label: 'פרוסת חיים' },
  { value: 'sports',    label: 'ספורט' },
  { value: 'supernatural', label: 'על-טבעי' },
  { value: 'thriller',  label: 'מותחן' },
  { value: 'ecchi',     label: 'אצ׳י' },
  { value: 'shounen',   label: 'שונן' },
  { value: 'shoujo',    label: 'שוג׳ו' },
  { value: 'seinen',    label: 'סיינן' },
  { value: 'josei',     label: 'ג׳וסיי' },
] as const

export const SEARCH_MIN_LENGTH = 2
export const SEARCH_DEBOUNCE_MS = 300
export const SEARCH_MAX_RESULTS = 20
