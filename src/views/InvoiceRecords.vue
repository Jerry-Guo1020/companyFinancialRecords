<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  Download,
  Calendar as CalendarIcon,
  Plus,
  Pencil,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-vue-next'

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
  DialogFooter,
} from '@/components/ui/dialog'
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

// ==================== 类型定义 ====================

interface InvoiceRecord {
  id: string
  date: Date
  summary: string           // 消费项/摘要
  expenseCategory: string   // 支出科目
  amount: number
  accountId: string         // 关联账户
  invoiceStatus: 'invoiced' | 'pending'  // 发票状态
  invoiceType: 'special' | 'normal' | 'electronic'  // 发票类型
  remark: string
}

// ==================== 模拟数据 ====================

// 账户列表
const accounts = ref([
  { id: '1', name: '农业银行' },
  { id: '2', name: '中国银行' },
  { id: '3', name: '现金' },
  { id: '4', name: '建设银行' },
])

// 支出科目
const expenseCategories = ref([
  '办公费用',
  '人员工资',
  '采购支出',
  '水电费',
  '交通费',
  '差旅费',
  '招待费',
  '其他支出',
])

// 开票记录数据
const records = ref<InvoiceRecord[]>([
  {
    id: '1',
    date: new Date(2026, 2, 5),
    summary: '办公室装修材料采购',
    expenseCategory: '采购支出',
    amount: 15000,
    accountId: '1',
    invoiceStatus: 'invoiced',
    invoiceType: 'special',
    remark: '供应商：北京建材公司',
  },
  {
    id: '2',
    date: new Date(2026, 2, 8),
    summary: '员工出差机票费用',
    expenseCategory: '差旅费',
    amount: 3500,
    accountId: '2',
    invoiceStatus: 'pending',
    invoiceType: 'electronic',
    remark: '待航空公司开具电子发票',
  },
  {
    id: '3',
    date: new Date(2026, 2, 10),
    summary: '办公用品采购',
    expenseCategory: '办公费用',
    amount: 2800,
    accountId: '3',
    invoiceStatus: 'invoiced',
    invoiceType: 'normal',
    remark: '已收到纸质发票',
  },
  {
    id: '4',
    date: new Date(2026, 2, 12),
    summary: '客户招待餐费',
    expenseCategory: '招待费',
    amount: 1200,
    accountId: '3',
    invoiceStatus: 'pending',
    invoiceType: 'electronic',
    remark: '餐厅电子发票待开具',
  },
  {
    id: '5',
    date: new Date(2026, 2, 15),
    summary: '公司车辆维修保养',
    expenseCategory: '其他支出',
    amount: 4500,
    accountId: '4',
    invoiceStatus: 'invoiced',
    invoiceType: 'special',
    remark: '4S店已开具增值税专票',
  },
  {
    id: '6',
    date: new Date(2026, 2, 18),
    summary: '水电费缴纳',
    expenseCategory: '水电费',
    amount: 3200,
    accountId: '1',
    invoiceStatus: 'pending',
    invoiceType: 'normal',
    remark: '物业待开具发票',
  },
])

// ==================== 筛选状态 ====================

const dateFrom = ref<Date | undefined>()
const dateTo = ref<Date | undefined>()
const statusFilter = ref<'all' | 'invoiced' | 'pending'>('all')

// ==================== 弹窗状态 ====================

const dialogOpen = ref(false)
const editDialogOpen = ref(false)
const editingRecord = ref<InvoiceRecord | null>(null)

// 表单数据
const formData = ref({
  date: new Date(),
  summary: '',
  expenseCategory: '',
  amount: 0,
  accountId: '',
  invoiceStatus: 'pending' as 'invoiced' | 'pending',
  invoiceType: 'electronic' as 'special' | 'normal' | 'electronic',
  remark: '',
})

// ==================== 计算属性 ====================

// 筛选后的记录
const filteredRecords = computed(() => {
  return records.value.filter((record) => {
    // 日期筛选
    if (dateFrom.value && record.date < dateFrom.value) return false
    if (dateTo.value && record.date > dateTo.value) return false

    // 状态筛选
    if (statusFilter.value !== 'all' && record.invoiceStatus !== statusFilter.value) {
      return false
    }

    return true
  }).sort((a, b) => b.date.getTime() - a.date.getTime())
})

// 统计数据
const totalAmount = computed(() => {
  return filteredRecords.value.reduce((sum, r) => sum + r.amount, 0)
})

const invoicedAmount = computed(() => {
  return filteredRecords.value
    .filter((r) => r.invoiceStatus === 'invoiced')
    .reduce((sum, r) => sum + r.amount, 0)
})

const pendingAmount = computed(() => {
  return filteredRecords.value
    .filter((r) => r.invoiceStatus === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)
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

// 获取发票类型名称
const getInvoiceTypeName = (type: string) => {
  const types: Record<string, string> = {
    special: '增值税专票',
    normal: '增值税普票',
    electronic: '电子发票',
  }
  return types[type] || type
}

// 获取发票状态配置
const getInvoiceStatusConfig = (status: string) => {
  if (status === 'invoiced') {
    return {
      label: '已开票',
      class: 'bg-green-100 text-green-700 hover:bg-green-100',
    }
  }
  return {
    label: '待开票',
    class: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  }
}

// 重置筛选
const resetFilters = () => {
  dateFrom.value = undefined
  dateTo.value = undefined
  statusFilter.value = 'all'
}

// 新增记录
const handleAddRecord = () => {
  const newRecord: InvoiceRecord = {
    id: Date.now().toString(),
    date: formData.value.date,
    summary: formData.value.summary,
    expenseCategory: formData.value.expenseCategory,
    amount: Number(formData.value.amount),
    accountId: formData.value.accountId,
    invoiceStatus: formData.value.invoiceStatus,
    invoiceType: formData.value.invoiceType,
    remark: formData.value.remark,
  }

  records.value.push(newRecord)
  resetForm()
  dialogOpen.value = false
}

// 编辑记录
const openEditDialog = (record: InvoiceRecord) => {
  editingRecord.value = { ...record }
  formData.value = {
    date: new Date(record.date),
    summary: record.summary,
    expenseCategory: record.expenseCategory,
    amount: record.amount,
    accountId: record.accountId,
    invoiceStatus: record.invoiceStatus,
    invoiceType: record.invoiceType,
    remark: record.remark,
  }
  editDialogOpen.value = true
}

// 保存编辑
const handleSaveEdit = () => {
  if (!editingRecord.value) return

  const index = records.value.findIndex((r) => r.id === editingRecord.value!.id)
  if (index !== -1) {
    records.value[index] = {
      ...records.value[index],
      date: formData.value.date,
      summary: formData.value.summary,
      expenseCategory: formData.value.expenseCategory,
      amount: Number(formData.value.amount),
      accountId: formData.value.accountId,
      invoiceStatus: formData.value.invoiceStatus,
      invoiceType: formData.value.invoiceType,
      remark: formData.value.remark,
    }
  }

  editDialogOpen.value = false
  editingRecord.value = null
}

// 快速切换开票状态
const toggleInvoiceStatus = (record: InvoiceRecord) => {
  record.invoiceStatus = record.invoiceStatus === 'invoiced' ? 'pending' : 'invoiced'
}

// 重置表单
const resetForm = () => {
  formData.value = {
    date: new Date(),
    summary: '',
    expenseCategory: '',
    amount: 0,
    accountId: '',
    invoiceStatus: 'pending',
    invoiceType: 'electronic',
    remark: '',
  }
}

// 导出 Excel
const exportToExcel = () => {
  // 准备导出数据
  const exportData = filteredRecords.value.map((record, index) => ({
    '序号': index + 1,
    '日期': formatDate(record.date),
    '消费项/摘要': record.summary,
    '支出科目': record.expenseCategory,
    '金额(元)': record.amount,
    '关联账户': getAccountName(record.accountId),
    '发票状态': record.invoiceStatus === 'invoiced' ? '已开票' : '待开票',
    '发票类型': getInvoiceTypeName(record.invoiceType),
    '备注': record.remark,
  }))

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(exportData)

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 6 },   // 序号
    { wch: 12 },  // 日期
    { wch: 25 },  // 消费项/摘要
    { wch: 12 },  // 支出科目
    { wch: 12 },  // 金额
    { wch: 12 },  // 关联账户
    { wch: 10 },  // 发票状态
    { wch: 12 },  // 发票类型
    { wch: 30 },  // 备注
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '开票记录')

  // 生成文件名
  const fileName = `开票记录_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`

  // 导出文件
  XLSX.writeFile(workbook, fileName)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">消费开票记录</h1>
          <p class="mt-1 text-gray-500">管理公司消费及开发票进度</p>
        </div>
        <div class="flex gap-3">
          <Button variant="outline" class="gap-2" @click="exportToExcel">
            <Download class="h-4 w-4" />
            导出 Excel
          </Button>
          <Dialog v-model:open="dialogOpen">
            <DialogTrigger as-child>
              <Button class="gap-2">
                <Plus class="h-4 w-4" />
                新增记录
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新增开票记录</DialogTitle>
                <DialogDescription>
                  请填写消费及开票信息，带 * 为必填项
                </DialogDescription>
              </DialogHeader>

              <div class="space-y-4">
                <!-- 日期 -->
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

                <!-- 消费项/摘要 -->
                <div class="space-y-2">
                  <Label>消费项/摘要 *</Label>
                  <Input v-model="formData.summary" placeholder="请输入消费项或摘要" />
                </div>

                <!-- 支出科目 -->
                <div class="space-y-2">
                  <Label>支出科目 *</Label>
                  <Select v-model="formData.expenseCategory">
                    <SelectTrigger>
                      <SelectValue placeholder="选择支出科目" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="cat in expenseCategories" :key="cat" :value="cat">
                          {{ cat }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 金额 -->
                <div class="space-y-2">
                  <Label>金额 (元) *</Label>
                  <Input v-model.number="formData.amount" type="number" placeholder="请输入金额" :min="0" />
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

                <!-- 发票状态 -->
                <div class="space-y-2">
                  <Label>发票状态 *</Label>
                  <Select v-model="formData.invoiceStatus">
                    <SelectTrigger>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="pending">待开票</SelectItem>
                        <SelectItem value="invoiced">已开票</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 发票类型 -->
                <div class="space-y-2">
                  <Label>发票类型 *</Label>
                  <Select v-model="formData.invoiceType">
                    <SelectTrigger>
                      <SelectValue placeholder="选择发票类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="special">增值税专票</SelectItem>
                        <SelectItem value="normal">增值税普票</SelectItem>
                        <SelectItem value="electronic">电子发票</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 备注 -->
                <div class="space-y-2">
                  <Label>备注</Label>
                  <Textarea v-model="formData.remark" placeholder="请输入备注信息" rows="2" />
                </div>

                <Button
                  class="w-full"
                  :disabled="!formData.summary || !formData.expenseCategory || !formData.amount || !formData.accountId"
                  @click="handleAddRecord"
                >
                  确认添加
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">消费总额</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-gray-900">{{ formatMoney(totalAmount) }}</div>
            <p class="mt-1 text-xs text-gray-500">共 {{ filteredRecords.length }} 条记录</p>
          </CardContent>
        </Card>

        <Card class="border-l-4 border-l-green-500">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">已开票金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ formatMoney(invoicedAmount) }}</div>
            <p class="mt-1 text-xs text-gray-500">
              {{ filteredRecords.filter(r => r.invoiceStatus === 'invoiced').length }} 条已开票
            </p>
          </CardContent>
        </Card>

        <Card class="border-l-4 border-l-amber-500">
          <CardHeader class="pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">待开票金额</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-amber-600">{{ formatMoney(pendingAmount) }}</div>
            <p class="mt-1 text-xs text-gray-500">
              {{ filteredRecords.filter(r => r.invoiceStatus === 'pending').length }} 条待开票
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- 筛选区域 -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-wrap items-end gap-4">
            <!-- 日期范围 - 开始 -->
            <div class="space-y-2">
              <Label class="text-xs text-gray-500">开始日期</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-[160px] justify-start text-left font-normal">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ dateFrom ? formatDate(dateFrom) : '选择日期' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar v-model:model-value="dateFrom" />
                </PopoverContent>
              </Popover>
            </div>

            <!-- 日期范围 - 结束 -->
            <div class="space-y-2">
              <Label class="text-xs text-gray-500">结束日期</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-[160px] justify-start text-left font-normal">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ dateTo ? formatDate(dateTo) : '选择日期' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar v-model:model-value="dateTo" />
                </PopoverContent>
              </Popover>
            </div>

            <!-- 发票状态筛选 -->
            <div class="space-y-2">
              <Label class="text-xs text-gray-500">发票状态</Label>
              <Select v-model="statusFilter">
                <SelectTrigger class="w-[140px]">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="invoiced">已开票</SelectItem>
                    <SelectItem value="pending">待开票</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 重置按钮 -->
            <Button variant="ghost" class="gap-2" @click="resetFilters">
              <Filter class="h-4 w-4" />
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 数据表格 -->
      <Card>
        <CardContent class="pt-6">
          <Table>
            <TableHeader>
              <TableRow class="bg-gray-50">
                <TableHead class="font-semibold">日期</TableHead>
                <TableHead class="font-semibold">消费项/摘要</TableHead>
                <TableHead class="font-semibold">支出科目</TableHead>
                <TableHead class="text-right font-semibold">金额</TableHead>
                <TableHead class="font-semibold">关联账户</TableHead>
                <TableHead class="font-semibold">发票状态</TableHead>
                <TableHead class="font-semibold">发票类型</TableHead>
                <TableHead class="font-semibold">备注</TableHead>
                <TableHead class="text-center font-semibold">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="record in filteredRecords" :key="record.id">
                <TableCell class="whitespace-nowrap">{{ formatDate(record.date) }}</TableCell>
                <TableCell class="max-w-[200px] truncate">{{ record.summary }}</TableCell>
                <TableCell>{{ record.expenseCategory }}</TableCell>
                <TableCell class="text-right font-medium">{{ formatMoney(record.amount) }}</TableCell>
                <TableCell>{{ getAccountName(record.accountId) }}</TableCell>
                <TableCell>
                  <Badge
                    :class="getInvoiceStatusConfig(record.invoiceStatus).class"
                    class="cursor-pointer"
                    @click="toggleInvoiceStatus(record)"
                  >
                    {{ getInvoiceStatusConfig(record.invoiceStatus).label }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span class="text-sm">{{ getInvoiceTypeName(record.invoiceType) }}</span>
                </TableCell>
                <TableCell class="max-w-[150px] truncate text-sm text-gray-500">
                  {{ record.remark || '-' }}
                </TableCell>
                <TableCell class="text-center">
                  <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="openEditDialog(record)">
                    <Pencil class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="filteredRecords.length === 0">
                <TableCell colspan="9" class="h-24 text-center text-gray-400">
                  暂无符合条件的记录
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- 编辑弹窗 -->
      <Dialog v-model:open="editDialogOpen">
        <DialogContent class="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑开票记录</DialogTitle>
            <DialogDescription>
              修改消费及开票信息
            </DialogDescription>
          </DialogHeader>

          <div class="space-y-4">
            <!-- 日期 -->
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

            <!-- 消费项/摘要 -->
            <div class="space-y-2">
              <Label>消费项/摘要 *</Label>
              <Input v-model="formData.summary" placeholder="请输入消费项或摘要" />
            </div>

            <!-- 支出科目 -->
            <div class="space-y-2">
              <Label>支出科目 *</Label>
              <Select v-model="formData.expenseCategory">
                <SelectTrigger>
                  <SelectValue placeholder="选择支出科目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="cat in expenseCategories" :key="cat" :value="cat">
                      {{ cat }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 金额 -->
            <div class="space-y-2">
              <Label>金额 (元) *</Label>
              <Input v-model.number="formData.amount" type="number" placeholder="请输入金额" :min="0" />
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

            <!-- 发票状态 -->
            <div class="space-y-2">
              <Label>发票状态 *</Label>
              <Select v-model="formData.invoiceStatus">
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="pending">待开票</SelectItem>
                    <SelectItem value="invoiced">已开票</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 发票类型 -->
            <div class="space-y-2">
              <Label>发票类型 *</Label>
              <Select v-model="formData.invoiceType">
                <SelectTrigger>
                  <SelectValue placeholder="选择发票类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="special">增值税专票</SelectItem>
                    <SelectItem value="normal">增值税普票</SelectItem>
                    <SelectItem value="electronic">电子发票</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 备注 -->
            <div class="space-y-2">
              <Label>备注</Label>
              <Textarea v-model="formData.remark" placeholder="请输入备注信息" rows="2" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" @click="editDialogOpen = false">取消</Button>
            <Button @click="handleSaveEdit">保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
</template>