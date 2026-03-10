<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Calendar as CalendarIcon,
} from 'lucide-vue-next'

import type { Account, FinancialRecord, Category } from '@/types'

// Shadcn 组件
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'

// ==================== 模拟数据 ====================

// 账户列表
const accounts = ref<Account[]>([
  { id: '1', name: '农业银行', openingBalance: 50000, monthlyIncome: 0, monthlyExpense: 0 },
  { id: '2', name: '中国银行', openingBalance: 30000, monthlyIncome: 0, monthlyExpense: 0 },
  { id: '3', name: '现金', openingBalance: 5000, monthlyIncome: 0, monthlyExpense: 0 },
  { id: '4', name: '建设银行', openingBalance: 20000, monthlyIncome: 0, monthlyExpense: 0 },
])

// 收入科目
const incomeCategories = ref<Category[]>([
  { id: 'i1', name: '销售收入', type: 'income' },
  { id: 'i2', name: '服务收入', type: 'income' },
  { id: 'i3', name: '利息收入', type: 'income' },
  { id: 'i4', name: '投资收益', type: 'income' },
  { id: 'i5', name: '其他收入', type: 'income' },
])

// 支出科目
const expenseCategories = ref<Category[]>([
  { id: 'e1', name: '办公费用', type: 'expense' },
  { id: 'e2', name: '人员工资', type: 'expense' },
  { id: 'e3', name: '采购支出', type: 'expense' },
  { id: 'e4', name: '水电费', type: 'expense' },
  { id: 'e5', name: '交通费', type: 'expense' },
  { id: 'e6', name: '其他支出', type: 'expense' },
])

// 收支记录
const records = ref<FinancialRecord[]>([
  {
    id: '1',
    date: new Date(2026, 2, 5),
    type: 'income',
    category: '销售收入',
    amount: 50000,
    accountId: '1',
    summary: '3月份产品销售款项',
    handler: '张三',
  },
  {
    id: '2',
    date: new Date(2026, 2, 8),
    type: 'expense',
    category: '办公费用',
    amount: 3500,
    accountId: '3',
    summary: '购买办公用品',
    handler: '李四',
  },
  {
    id: '3',
    date: new Date(2026, 2, 10),
    type: 'income',
    category: '服务收入',
    amount: 25000,
    accountId: '2',
    summary: '技术服务费',
    handler: '王五',
  },
  {
    id: '4',
    date: new Date(2026, 2, 12),
    type: 'expense',
    category: '人员工资',
    amount: 35000,
    accountId: '1',
    summary: '3月份工资发放',
    handler: '张三',
  },
  {
    id: '5',
    date: new Date(2026, 2, 15),
    type: 'expense',
    category: '水电费',
    amount: 1200,
    accountId: '4',
    summary: '办公室水电费',
    handler: '李四',
  },
])

// ==================== 弹窗状态 ====================

const dialogOpen = ref(false)
const activeTab = ref<'income' | 'expense'>('income')

// 表单数据
const formData = ref({
  date: new Date(),
  category: '',
  amount: 0,
  accountId: '',
  summary: '',
  handler: '',
})

// ==================== 计算属性 ====================

// 本月总收入
const totalIncome = computed(() => {
  return records.value
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0)
})

// 本月总支出
const totalExpense = computed(() => {
  return records.value
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0)
})

// 实时结余 = 期初总额 + 本月收入 - 本月支出
const totalOpeningBalance = computed(() => {
  return accounts.value.reduce((sum, a) => sum + a.openingBalance, 0)
})

const currentBalance = computed(() => {
  return totalOpeningBalance.value + totalIncome.value - totalExpense.value
})

// 账户汇总表数据
const accountSummaries = computed(() => {
  return accounts.value.map((account) => {
    const accountIncome = records.value
      .filter((r) => r.type === 'income' && r.accountId === account.id)
      .reduce((sum, r) => sum + r.amount, 0)

    const accountExpense = records.value
      .filter((r) => r.type === 'expense' && r.accountId === account.id)
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      ...account,
      monthlyIncome: accountIncome,
      monthlyExpense: accountExpense,
      closingBalance: account.openingBalance + accountIncome - accountExpense,
    }
  })
})

// 收入明细
const incomeRecords = computed(() => {
  return records.value
    .filter((r) => r.type === 'income')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
})

// 支出明细
const expenseRecords = computed(() => {
  return records.value
    .filter((r) => r.type === 'expense')
    .sort((a, b) => b.date.getTime() - a.date.getTime())
})

// ==================== 方法 ====================

// 格式化金额
const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount)
}

// 格式化日期
const formatDate = (date: Date) => {
  return format(date, 'yyyy-MM-dd', { locale: zhCN })
}

// 获取账户名称
const getAccountName = (accountId: string) => {
  return accounts.value.find((a) => a.id === accountId)?.name || '未知账户'
}

// 提交表单
const handleSubmit = () => {
  const newRecord: FinancialRecord = {
    id: Date.now().toString(),
    date: formData.value.date,
    type: activeTab.value,
    category: formData.value.category,
    amount: Number(formData.value.amount),
    accountId: formData.value.accountId,
    summary: formData.value.summary,
    handler: formData.value.handler || undefined,
  }

  records.value.push(newRecord)
  resetForm()
  dialogOpen.value = false
}

// 重置表单
const resetForm = () => {
  formData.value = {
    date: new Date(),
    category: '',
    amount: 0,
    accountId: '',
    summary: '',
    handler: '',
  }
}

// 监听 tab 切换，清空科目选择
const handleTabChange = (value: string | number) => {
  activeTab.value = value as 'income' | 'expense'
  formData.value.category = ''
}
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">财务收支明细平台</h1>
          <p class="mt-1 text-gray-500">{{ format(new Date(), 'yyyy年MM月', { locale: zhCN }) }}财务报表</p>
        </div>
        <Dialog v-model:open="dialogOpen">
          <DialogTrigger as-child>
            <Button class="gap-2">
              <Plus class="h-4 w-4" />
              新增记录
            </Button>
          </DialogTrigger>
          <DialogContent class="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>新增收支记录</DialogTitle>
              <DialogDescription>
                请填写收支明细信息，带 * 为必填项
              </DialogDescription>
            </DialogHeader>

            <Tabs v-model="activeTab" class="w-full" @update:model-value="handleTabChange">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="income" class="text-green-600 data-[state=active]:bg-green-50">
                  收入
                </TabsTrigger>
                <TabsTrigger value="expense" class="text-red-600 data-[state=active]:bg-red-50">
                  支出
                </TabsTrigger>
              </TabsList>

              <div class="mt-4 space-y-4">
                <!-- 日期选择 -->
                <div class="space-y-2">
                  <Label>日期 *</Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline" class="w-full justify-start text-left font-normal">
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{ formData.date ? formatDate(formData.date) : '选择日期' }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar v-model:model-value="formData.date" />
                    </PopoverContent>
                  </Popover>
                </div>

                <!-- 科目分类 -->
                <div class="space-y-2">
                  <Label>科目分类 *</Label>
                  <Select v-model="formData.category">
                    <SelectTrigger>
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem
                          v-for="cat in activeTab === 'income' ? incomeCategories : expenseCategories"
                          :key="cat.id"
                          :value="cat.name"
                        >
                          {{ cat.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 金额 -->
                <div class="space-y-2">
                  <Label>金额 (元) *</Label>
                  <Input
                    v-model.number="formData.amount"
                    type="number"
                    placeholder="请输入金额"
                    :min="0"
                  />
                </div>

                <!-- 关联账户 -->
                <div class="space-y-2">
                  <Label>关联账户 *</Label>
                  <Select v-model="formData.accountId">
                    <SelectTrigger>
                      <SelectValue placeholder="选择账户" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="acc in accounts" :key="acc.id" :value="acc.id">
                          {{ acc.name }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 摘要 -->
                <div class="space-y-2">
                  <Label>摘要 *</Label>
                  <Textarea
                    v-model="formData.summary"
                    placeholder="请输入摘要说明"
                    rows="3"
                  />
                </div>

                <!-- 经手人 -->
                <div class="space-y-2">
                  <Label>经手人</Label>
                  <Input v-model="formData.handler" placeholder="请输入经手人姓名" />
                </div>

                <!-- 提交按钮 -->
                <Button
                  class="w-full"
                  :disabled="!formData.category || !formData.amount || !formData.accountId || !formData.summary"
                  @click="handleSubmit"
                >
                  确认提交
                </Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      <!-- 统计卡片 -->
      <div class="grid gap-4 md:grid-cols-3">
        <!-- 本月总收入 -->
        <Card class="border-l-4 border-l-green-500">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">本月总收入</CardTitle>
            <TrendingUp class="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ formatMoney(totalIncome) }}</div>
            <p class="mt-1 text-xs text-gray-500">共 {{ incomeRecords.length }} 笔收入</p>
          </CardContent>
        </Card>

        <!-- 本月总支出 -->
        <Card class="border-l-4 border-l-red-500">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">本月总支出</CardTitle>
            <TrendingDown class="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-red-600">{{ formatMoney(totalExpense) }}</div>
            <p class="mt-1 text-xs text-gray-500">共 {{ expenseRecords.length }} 笔支出</p>
          </CardContent>
        </Card>

        <!-- 实时结余 -->
        <Card class="border-l-4 border-l-blue-500">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">实时结余</CardTitle>
            <Wallet class="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold" :class="currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'">
              {{ formatMoney(currentBalance) }}
            </div>
            <p class="mt-1 text-xs text-gray-500">期初: {{ formatMoney(totalOpeningBalance) }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- 账户汇总表 -->
      <Card>
        <CardHeader>
          <CardTitle>账户汇总</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow class="bg-gray-50">
                <TableHead class="font-semibold">账户名称</TableHead>
                <TableHead class="text-right font-semibold">月初余额</TableHead>
                <TableHead class="text-right font-semibold text-green-600">本月收入</TableHead>
                <TableHead class="text-right font-semibold text-red-600">本月支出</TableHead>
                <TableHead class="text-right font-semibold">月末余额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="summary in accountSummaries" :key="summary.id">
                <TableCell class="font-medium">{{ summary.name }}</TableCell>
                <TableCell class="text-right">{{ formatMoney(summary.openingBalance) }}</TableCell>
                <TableCell class="text-right text-green-600">{{ formatMoney(summary.monthlyIncome) }}</TableCell>
                <TableCell class="text-right text-red-600">{{ formatMoney(summary.monthlyExpense) }}</TableCell>
                <TableCell class="text-right font-medium" :class="summary.closingBalance >= 0 ? 'text-blue-600' : 'text-red-600'">
                  {{ formatMoney(summary.closingBalance) }}
                </TableCell>
              </TableRow>
              <!-- 合计行 -->
              <TableRow class="bg-gray-100 font-bold">
                <TableCell>合计</TableCell>
                <TableCell class="text-right">{{ formatMoney(totalOpeningBalance) }}</TableCell>
                <TableCell class="text-right text-green-600">{{ formatMoney(totalIncome) }}</TableCell>
                <TableCell class="text-right text-red-600">{{ formatMoney(totalExpense) }}</TableCell>
                <TableCell class="text-right" :class="currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'">
                  {{ formatMoney(currentBalance) }}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- 明细分栏 -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- 收入明细 -->
        <Card class="border-t-4 border-t-green-500">
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center gap-2 text-green-700">
                <TrendingUp class="h-5 w-5" />
                收入明细
              </CardTitle>
              <Badge variant="secondary" class="bg-green-100 text-green-700">
                {{ incomeRecords.length }} 笔
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="record in incomeRecords"
                :key="record.id"
                class="rounded-lg border border-green-100 bg-green-50/50 p-3"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ record.category }}</span>
                      <Badge variant="outline" class="text-xs">{{ getAccountName(record.accountId) }}</Badge>
                    </div>
                    <p class="mt-1 text-sm text-gray-600">{{ record.summary }}</p>
                    <div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span>{{ formatDate(record.date) }}</span>
                      <span v-if="record.handler">经手人: {{ record.handler }}</span>
                    </div>
                  </div>
                  <span class="text-lg font-semibold text-green-600">
                    +{{ formatMoney(record.amount) }}
                  </span>
                </div>
              </div>
              <div v-if="incomeRecords.length === 0" class="py-8 text-center text-gray-400">
                暂无收入记录
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 支出明细 -->
        <Card class="border-t-4 border-t-red-500">
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <CardTitle class="flex items-center gap-2 text-red-700">
                <TrendingDown class="h-5 w-5" />
                支出明细
              </CardTitle>
              <Badge variant="secondary" class="bg-red-100 text-red-700">
                {{ expenseRecords.length }} 笔
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="record in expenseRecords"
                :key="record.id"
                class="rounded-lg border border-red-100 bg-red-50/50 p-3"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-900">{{ record.category }}</span>
                      <Badge variant="outline" class="text-xs">{{ getAccountName(record.accountId) }}</Badge>
                    </div>
                    <p class="mt-1 text-sm text-gray-600">{{ record.summary }}</p>
                    <div class="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span>{{ formatDate(record.date) }}</span>
                      <span v-if="record.handler">经手人: {{ record.handler }}</span>
                    </div>
                  </div>
                  <span class="text-lg font-semibold text-red-600">
                    -{{ formatMoney(record.amount) }}
                  </span>
                </div>
              </div>
              <div v-if="expenseRecords.length === 0" class="py-8 text-center text-gray-400">
                暂无支出记录
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>