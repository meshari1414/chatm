import { Users } from 'lucide-react'

const COLORS = [
  'bg-teal-600', 'bg-blue-600', 'bg-purple-600',
  'bg-orange-500', 'bg-pink-600', 'bg-indigo-600',
  'bg-green-600', 'bg-red-500',
]

function getColor(name = '') {
  const code = name.charCodeAt(0) || 0
  return COLORS[code % COLORS.length]
}

// الأحجام المحددة مسبقاً (لأن Tailwind لا يدعم الكلاسات الديناميكية)
const sizeMap = {
  8:  { box: 'w-8 h-8',   text: 'text-sm'  },
  9:  { box: 'w-9 h-9',   text: 'text-sm'  },
  10: { box: 'w-10 h-10', text: 'text-base' },
  11: { box: 'w-11 h-11', text: 'text-base' },
  12: { box: 'w-12 h-12', text: 'text-lg'  },
  14: { box: 'w-14 h-14', text: 'text-xl'  },
  16: { box: 'w-16 h-16', text: 'text-2xl' },
}

export default function Avatar({ name = '', photo, size = 10, isGroup = false }) {
  const initial   = name?.charAt(0)?.toUpperCase() || '?'
  const sizeStyle = sizeMap[size] || sizeMap[10]
  const iconSize  = size >= 12 ? 22 : size >= 10 ? 18 : 14

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={`${sizeStyle.box} rounded-full object-cover shrink-0`}
      />
    )
  }

  if (isGroup) {
    return (
      <div className={`${sizeStyle.box} rounded-full bg-teal-700 flex items-center justify-center shrink-0`}>
        <Users size={iconSize} className="text-white" />
      </div>
    )
  }

  return (
    <div className={`${sizeStyle.box} rounded-full ${getColor(name)} flex items-center justify-center shrink-0`}>
      <span className={`${sizeStyle.text} font-semibold text-white select-none`}>{initial}</span>
    </div>
  )
}
