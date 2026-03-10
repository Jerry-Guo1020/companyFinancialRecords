<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogClose } from 'radix-vue'
import { X } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <DialogClose
    :class="cn(
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground',
      props.class,
    )"
  >
    <X class="w-4 h-4" />
    <span class="sr-only">Close</span>
  </DialogClose>
</template>