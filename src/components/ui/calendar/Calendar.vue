<script setup lang="ts">
import { type HTMLAttributes, computed } from 'vue'
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'
import {
  CalendarRoot,
  type CalendarRootEmits,
  type CalendarRootProps,
  useForwardPropsEmits,
} from 'radix-vue'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

type DateValue = Date

interface Props extends CalendarRootProps {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()
const emits = defineEmits<CalendarRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

const formattedMonth = computed(() => {
  if (!props.modelValue) return ''
  const date = props.modelValue as DateValue
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})
</script>

<template>
  <CalendarRoot
    v-slot="{ grid, weekDays }"
    :locale="'zh-CN'"
    v-bind="forwarded"
    :class="cn('p-3', props.class)"
  >
    <div class="flex items-center justify-between mb-4">
      <button
        :class="cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        )"
        @click="() => {}"
      >
        <ChevronLeft class="w-4 h-4" />
      </button>
      <div class="text-sm font-medium">
        {{ formattedMonth }}
      </div>
      <button
        :class="cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
        )"
        @click="() => {}"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th
            v-for="day in weekDays"
            :key="day"
            class="text-xs font-medium text-muted-foreground w-9 p-1"
          >
            {{ day }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(week, weekIndex) in grid" :key="weekIndex">
          <td
            v-for="(day, dayIndex) in week"
            :key="dayIndex"
            class="p-0"
          >
            <button
              :class="cn(
                buttonVariants({ variant: 'ghost' }),
                'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
                day.isSelected && 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day.isToday && 'bg-accent text-accent-foreground',
                !day.isCurrentMonth && 'text-muted-foreground opacity-50',
              )"
              :disabled="day.isDisabled"
            >
              {{ day.day }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </CalendarRoot>
</template>