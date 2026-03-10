import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      title: '财务总览',
    },
  },
  {
    path: '/invoices',
    name: 'InvoiceManagement',
    component: () => import('@/views/InvoiceManagement.vue'),
    meta: {
      title: '报销/开票管理',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫 - 设置页面标题
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '财务管理系统'
  next()
})

export default router