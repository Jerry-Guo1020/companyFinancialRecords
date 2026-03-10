<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Wallet, LayoutDashboard, FileText } from 'lucide-vue-next'

// Shadcn 组件
import { Button } from '@/components/ui/button'

const route = useRoute()
const router = useRouter()

// 当前激活的导航
const currentPath = computed(() => route.path)

// 导航菜单
const navItems = [
  { path: '/', label: '财务总览', icon: LayoutDashboard },
  { path: '/invoices', label: '报销/开票管理', icon: FileText },
]

// 导航跳转
const navigateTo = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 顶部导航栏 -->
    <header class="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <Wallet class="h-6 w-6 text-primary" />
          <span class="text-lg font-bold">财务管理系统</span>
        </div>

        <!-- 导航菜单 -->
        <nav class="flex gap-1">
          <Button
            v-for="item in navItems"
            :key="item.path"
            :variant="currentPath === item.path ? 'default' : 'ghost'"
            class="gap-2"
            @click="navigateTo(item.path)"
          >
            <component :is="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </Button>
        </nav>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main>
      <router-view />
    </main>
  </div>
</template>