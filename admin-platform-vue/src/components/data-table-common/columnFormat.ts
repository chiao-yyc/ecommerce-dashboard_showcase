import { h } from 'vue'
import Copyable from '@/components/common/Copyable.vue'

export function textCopyable(
  text: string | undefined,
  textClass?: string,
  sliceLength?: number,
) {
  // Handle undefined or null text
  const safeText = text || '-'
  const displayText = sliceLength && text ? text.slice(0, sliceLength) : safeText
  
  return h('div', { class: 'flex gap-1 items-center group' }, [
    h(
      'span',
      { class: textClass },
      displayText,
    ),
    h(Copyable, {
      source: text || '',
      class:
        'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
    }),
  ])
}
