<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import * as XLSX from 'xlsx'
import {
  Plus,
  Download,
  Calendar as CalendarIcon,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Upload,
  Eye,
  Pencil,
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

// 发票状态
type InvoiceStatus = 'not_requested' | 'received'

// 报销/转账状态
type ReimbursementStatus = 'advanced' | 'pending_approval' | 'settled'

// 垫付记录
interface AdvanceRecord {
  id: string
  date: Date
  advancePerson: string        // 垫付人
  usage: string                // 消费用途
  amount: number               // 金额
  invoiceStatus: InvoiceStatus // 发票状态
  reimbursementStatus: ReimbursementStatus // 报销/转账状态
  invoiceType?: string         // 发票类型
  attachment?: string          // 发票附件
  remark?: string              // 备注
}

// ==================== 筛选状态 ====================

const dateRange = ref<{ start: Date | null; end: Date | null }>({
  start: null,
  end: null,
})
const filterInvoiceStatus = ref<string>('all')
const filterReimbursementStatus = ref<string>('all')

// ==================== 模拟数据 ====================

const advanceRecords = ref<AdvanceRecord[]>([
  {
    id: '1',
    date: new Date(2026, 2, 5),
    advancePerson: '张三',
    usage: '购买办公用品',
    amount: 1580,
    invoiceStatus: 'received',
    reimbursementStatus: 'settled',
    invoiceType: '增值税普票',
    remark: '打印机耗材、文件夹等',
  },
  {
    id: '2',
    date: new Date(2026, 2, 8),
    advancePerson: '李四',
    usage: '客户招待餐费',
    amount: 856,
    invoiceStatus: 'not_requested',
    reimbursementStatus: 'advanced',
    remark: '招待XX公司客户',
  },
  {
    id: '3',
    date: new Date(2026, 2, 10),
    advancePerson: '王五',
    usage: '出差交通费',
    amount: 2350,
    invoiceStatus: 'received',
    reimbursementStatus: 'pending_approval',
    invoiceType: '增值税专票',
    remark: '北京出差高铁票',
  },
  {
    id: '4',
    date: new Date(2026, 2, 12),
    advancePerson: '张三',
    usage: '设备维修费',
    amount: 4200,
    invoiceStatus: 'received',
    reimbursementStatus: 'settled',
    invoiceType: '增值税专票',
  },
  {
    id: '5',
    date: new Date(2026, 2, 15),
    advancePerson: '赵六',
    usage: '快递物流费',
    amount: 320,
    invoiceStatus: 'not_requested',
    reimbursementStatus: 'advanced',
  },
])

// 垫付人列表
const advancePersons = ['张三', '李四', '王五', '赵六', '钱七']

// 发票类型选项
const invoiceTypes = ['增值税专票', '增值税普票', '电子发票']

// 消费用途选项
const usageOptions = [
  '办公用品',
  '交通费',
  '招待费',
  '差旅费',
  '设备维修',
  '快递物流',
  '其他',
]

// ==================== 弹窗状态 ====================

const dialogOpen = ref(false)
const editDialogOpen = ref(false)
const editingRecord = ref<AdvanceRecord | null>(null)

// 表单数据
const formData = ref({
  date: new Date(),
  advancePerson: '',
  usage: '',
  amount: 0,
  invoiceStatus: 'not_requested' as InvoiceStatus,
  invoiceType: '',
  remark: '',
})

// ==================== 计算属性 ====================

// 筛选后的记录
const filteredRecords = computed(() => {
  let result = [...advanceRecords.value]

  // 日期范围筛选
  if (dateRange.value.start && dateRange.value.end) {
    result = result.filter((r) => {
      const recordDate = r.date.getTime()
      return (
        recordDate >= dateRange.value.start!.getTime() &&
        recordDate <= dateRange.value.end!.getTime()
      )
    })
  }

  // 发票状态筛选
  if (filterInvoiceStatus.value !== 'all') {
    result = result.filter((r) => r.invoiceStatus === filterInvoiceStatus.value)
  }

  // 报销状态筛选
  if (filterReimbursementStatus.value !== 'all') {
    result = result.filter((r) => r.reimbursementStatus === filterReimbursementStatus.value)
  }

  // 按日期降序排序
  return result.sort((a, b) => b.date.getTime() - a.date.getTime())
})

// 统计数据
const totalAdvanced = computed(() => {
  return advanceRecords.value
    .filter((r) => r.reimbursementStatus === 'advanced')
    .reduce((sum, r) => sum + r.amount, 0)
})

const totalPendingApproval = computed(() => {
  return advanceRecords.value
    .filter((r) => r.reimbursementStatus === 'pending_approval')
    .reduce((sum, r) => sum + r.amount, 0)
})

const totalSettled = computed(() => {
  return advanceRecords.value
    .filter((r) => r.reimbursementStatus === 'settled')
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

// 获取发票状态 Badge 样式
const getInvoiceBadgeVariant = (status: InvoiceStatus) => {
  return status === 'received' ? 'default' : 'secondary'
}

const getInvoiceBadgeClass = (status: InvoiceStatus) => {
  return status === 'received'
    ? 'bg-green-100 text-green-700 hover:bg-green-100'
    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
}

const getInvoiceStatusText = (status: InvoiceStatus) => {
  return status === 'received' ? '已到票' : '未索取'
}

// 获取报销状态 Badge 样式
const getReimbursementBadgeClass = (status: ReimbursementStatus) => {
  switch (status) {
    case 'advanced':
      return 'bg-orange-100 text-orange-700 hover:bg-orange-100'
    case 'pending_approval':
      return 'bg-blue-100 text-blue-700 hover:bg-blue-100'
    case 'settled':
      return 'bg-green-100 text-green-700 hover:bg-green-100'
    default:
      return ''
  }
}

const getReimbursementStatusText = (status: ReimbursementStatus) => {
  switch (status) {
    case 'advanced':
      return '已垫付(待报销)'
    case 'pending_approval':
      return '报销审批中'
    case 'settled':
      return '公司已打款(已结清)'
    default:
      return ''
  }
}

// 获取报销状态图标
const getReimbursementIcon = (status: ReimbursementStatus) => {
  switch (status) {
    case 'advanced':
      return AlertCircle
    case 'pending_approval':
      return Clock
    case 'settled':
      return CheckCircle2
    default:
      return null
  }
}

// 快速切换发票状态
const toggleInvoiceStatus = (record: AdvanceRecord) => {
  record.invoiceStatus = record.invoiceStatus === 'received' ? 'not_requested' : 'received'
}

// 快速切换报销状态
const cycleReimbursementStatus = (record: AdvanceRecord) => {
  const statusOrder: ReimbursementStatus[] = ['advanced', 'pending_approval', 'settled']
  const currentIndex = statusOrder.indexOf(record.reimbursementStatus)
  const nextIndex = (currentIndex + 1) % statusOrder.length
  record.reimbursementStatus = statusOrder[nextIndex]
}

// 提交表单
const handleSubmit = () => {
  const newRecord: AdvanceRecord = {
    id: Date.now().toString(),
    date: formData.value.date,
    advancePerson: formData.value.advancePerson,
    usage: formData.value.usage,
    amount: Number(formData.value.amount),
    invoiceStatus: formData.value.invoiceStatus,
    invoiceType: formData.value.invoiceType || undefined,
    remark: formData.value.remark || undefined,
  }

  advanceRecords.value.push(newRecord)
  resetForm()
  dialogOpen.value = false
}

// 重置表单
const resetForm = () => {
  formData.value = {
    date: new Date(),
    advancePerson: '',
    usage: '',
    amount: 0,
    invoiceStatus: 'not_requested',
    invoiceType: '',
    remark: '',
  }
}

// 编辑记录
const openEditDialog = (record: AdvanceRecord) => {
  editingRecord.value = { ...record }
  editDialogOpen.value = true
}

// 保存编辑
const saveEdit = () => {
  if (!editingRecord.value) return

  const index = advanceRecords.value.findIndex((r) => r.id === editingRecord.value!.id)
  if (index !== -1) {
    advanceRecords.value[index] = { ...editingRecord.value }
  }

  editDialogOpen.value = false
  editingRecord.value = null
}

// 导出 Excel
const exportToExcel = () => {
  // 准备导出数据
  const exportData = filteredRecords.value.map((record) => ({
    '日期': formatDate(record.date),
    '垫付人': record.advancePerson,
    '消费用途': record.usage,
    '金额(元)': record.amount,
    '发票状态': getInvoiceStatusText(record.invoiceStatus),
    '发票类型': record.invoiceType || '-',
    '报销/转账状态': getReimbursementStatusText(record.reimbursementStatus),
    '备注': record.remark || '-',
  }))

  // 创建工作表
  const worksheet = XLSX.utils.json_to_sheet(exportData)

  // 设置列宽
  worksheet['!cols'] = [
    { wch: 12 }, // 日期
    { wch: 10 }, // 垫付人
    { wch: 15 }, // 消费用途
    { wch: 12 }, // 金额
    { wch: 10 }, // 发票状态
    { wch: 12 }, // 发票类型
    { wch: 20 }, // 报销/转账状态
    { wch: 20 }, // 备注
  ]

  // 创建工作簿
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '垫付报销记录')

  // 生成文件名
  const fileName = `垫付报销记录_${format(new Date(), 'yyyyMMdd', { locale: zhCN })}.xlsx`

  // 下载文件
  XLSX.writeFile(workbook, fileName)
}
</script>

<template>
  <div class="p-6">
    <div class="mx-auto max-w-7xl space-y-6">
      <!-- 页面标题 -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">报销/开票管理</h1>
          <p class="mt-1 text-gray-500">个人垫付与公司报销转账记录</p>
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
                新增垫付
              </Button>
            </DialogTrigger>
            <DialogContent class="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>新增垫付记录</DialogTitle>
                <DialogDescription>
                  录入个人垫付信息，带 * 为必填项
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

                <!-- 垫付人 -->
                <div class="space-y-2">
                  <Label>垫付人 *</Label>
                  <Select v-model="formData.advancePerson">
                    <SelectTrigger>
                      <SelectValue placeholder="选择垫付人" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="person in advancePersons" :key="person" :value="person">
                          {{ person }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 消费用途 -->
                <div class="space-y-2">
                  <Label>消费用途 *</Label>
                  <Select v-model="formData.usage">
                    <SelectTrigger>
                      <SelectValue placeholder="选择用途" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="usage in usageOptions" :key="usage" :value="usage">
                          {{ usage }}
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

                <!-- 发票状态 -->
                <div class="space-y-2">
                  <Label>发票状态</Label>
                  <Select v-model="formData.invoiceStatus">
                    <SelectTrigger>
                      <SelectValue placeholder="选择发票状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="not_requested">未索取</SelectItem>
                        <SelectItem value="received">已到票</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 发票类型 -->
                <div class="space-y-2">
                  <Label>发票类型</Label>
                  <Select v-model="formData.invoiceType">
                    <SelectTrigger>
                      <SelectValue placeholder="选择发票类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem v-for="type in invoiceTypes" :key="type" :value="type">
                          {{ type }}
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <!-- 备注 -->
                <div class="space-y-2">
                  <Label>备注</Label>
                  <Textarea
                    v-model="formData.remark"
                    placeholder="请输入备注信息"
                    rows="2"
                  />
                </div>

                <!-- 提交按钮 -->
                <Button
                  class="w-full"
                  :disabled="!formData.advancePerson || !formData.usage || !formData.amount"
                  @click="handleSubmit"
                >
                  确认提交
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="grid gap-4 md:grid-cols-3">
        <!-- 待报销金额 -->
        <Card class="border-l-4 border-l-orange-500">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">待报销金额</CardTitle>
            <AlertCircle class="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-orange-600">{{ formatMoney(totalAdvanced) }}</div>
            <p class="mt-1 text-xs text-gray-500">
              {{ advanceRecords.filter(r => r.reimbursementStatus === 'advanced').length }} 笔待报销
            </p>
          </CardContent>
        </Card>

        <!-- 审批中金额 -->
        <Card class="border-l-4 border-l-blue-500">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">审批中金额</CardTitle>
            <Clock class="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-blue-600">{{ formatMoney(totalPendingApproval) }}</div>
            <p class="mt-1 text-xs text-gray-500">
              {{ advanceRecords.filter(r => r.reimbursementStatus === 'pending_approval').length }} 笔审批中
            </p>
          </CardContent>
        </Card>

        <!-- 已结清金额 -->
        <Card class="border-l-4 border-l-green-500">
          <CardHeader class="flex flex-row items-center justify-between pb-2">
            <CardTitle class="text-sm font-medium text-gray-600">已结清金额</CardTitle>
            <CheckCircle2 class="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div class="text-2xl font-bold text-green-600">{{ formatMoney(totalSettled) }}</div>
            <p class="mt-1 text-xs text-gray-500">
              {{ advanceRecords.filter(r => r.reimbursementStatus === 'settled').length }} 笔已结清
            </p>
          </CardContent>
        </Card>
      </div>

      <!-- 筛选区域 -->
      <Card>
        <CardContent class="pt-6">
          <div class="flex flex-wrap items-end gap-4">
            <!-- 日期范围选择 -->
            <div class="space-y-2">
              <Label class="text-xs text-gray-500">开始日期</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ dateRange.start ? formatDate(dateRange.start) : '选择开始日期' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar v-model:model-value="dateRange.start" />
                </PopoverContent>
              </Popover>
            </div>

            <div class="space-y-2">
              <Label class="text-xs text-gray-500">结束日期</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" class="w-[180px] justify-start text-left font-normal">
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{ dateRange.end ? formatDate(dateRange.end) : '选择结束日期' }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar v-model:model-value="dateRange.end" />
                </PopoverContent>
              </Popover>
            </div>

            <!-- 发票状态筛选 -->
            <div class="space-y-2">
              <Label class="text-xs text-gray-500">发票状态</Label>
              <Select v-model="filterInvoiceStatus">
                <SelectTrigger class="w-[140px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="not_requested">未索取</SelectItem>
                    <SelectItem value="received">已到票</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 报销状态筛选 -->
            <div class="space-y-2">
              <Label class="text-xs text-gray-500">报销状态</Label>
              <Select v-model="filterReimbursementStatus">
                <SelectTrigger class="w-[160px]">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="advanced">已垫付(待报销)</SelectItem>
                    <SelectItem value="pending_approval">报销审批中</SelectItem>
                    <SelectItem value="settled">公司已打款</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- 重置筛选 -->
            <Button
              variant="ghost"
              @click="dateRange = { start: null, end: null }; filterInvoiceStatus = 'all'; filterReimbursementStatus = 'all'"
            >
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- 记录表格 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <FileText class="h-5 w-5" />
            垫付报销记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow class="bg-gray-50">
                <TableHead class="font-semibold">日期</TableHead>
                <TableHead class="font-semibold">垫付人</TableHead>
                <TableHead class="font-semibold">消费用途</TableHead>
                <TableHead class="text-right font-semibold">金额</TableHead>
                <TableHead class="font-semibold">发票状态</TableHead>
                <TableHead class="font-semibold">发票类型</TableHead>
                <TableHead class="font-semibold">报销/转账状态</TableHead>
                <TableHead class="font-semibold">附件</TableHead>
                <TableHead class="font-semibold">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="record in filteredRecords" :key="record.id">
                <TableCell>{{ formatDate(record.date) }}</TableCell>
                <TableCell class="font-medium">{{ record.advancePerson }}</TableCell>
                <TableCell>{{ record.usage }}</TableCell>
                <TableCell class="text-right font-medium">{{ formatMoney(record.amount) }}</TableCell>
                <TableCell>
                  <Badge
                    :variant="getInvoiceBadgeVariant(record.invoiceStatus)"
                    :class="getInvoiceBadgeClass(record.invoiceStatus)"
                    class="cursor-pointer"
                    @click="toggleInvoiceStatus(record)"
                  >
                    {{ getInvoiceStatusText(record.invoiceStatus) }}
                  </Badge>
                </TableCell>
                <TableCell>{{ record.invoiceType || '-' }}</TableCell>
                <TableCell>
                  <Badge
                    :class="getReimbursementBadgeClass(record.reimbursementStatus)"
                    class="cursor-pointer gap-1"
                    @click="cycleReimbursementStatus(record)"
                  >
                    <component :is="getReimbursementIcon(record.reimbursementStatus)" class="h-3 w-3" />
                    {{ getReimbursementStatusText(record.reimbursementStatus) }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button v-if="record.invoiceStatus === 'received'" variant="ghost" size="sm" class="gap-1">
                    <Eye class="h-4 w-4" />
                    查看
                  </Button>
                  <Button v-else variant="ghost" size="sm" class="gap-1 text-gray-400">
                    <Upload class="h-4 w-4" />
                    上传
                  </Button>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" @click="openEditDialog(record)">
                    <Pencil class="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow v-if="filteredRecords.length === 0">
                <TableCell colspan="9" class="py-8 text-center text-gray-400">
                  暂无记录
                </TableCell>
              </TableRow>
              <!-- 合计行 -->
              <TableRow v-if="filteredRecords.length > 0" class="bg-gray-100 font-bold">
                <TableCell colspan="3">合计</TableCell>
                <TableCell class="text-right">
                  {{ formatMoney(filteredRecords.reduce((sum, r) => sum + r.amount, 0)) }}
                </TableCell>
                <TableCell colspan="5"></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>

    <!-- 编辑弹窗 -->
    <Dialog v-model:open="editDialogOpen">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑垫付记录</DialogTitle>
        </DialogHeader>
        <div v-if="editingRecord" class="space-y-4">
          <div class="space-y-2">
            <Label>垫付人</Label>
            <Select v-model="editingRecord.advancePerson">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="person in advancePersons" :key="person" :value="person">
                    {{ person }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>消费用途</Label>
            <Select v-model="editingRecord.usage">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="usage in usageOptions" :key="usage" :value="usage">
                    {{ usage }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>金额</Label>
            <Input v-model.number="editingRecord.amount" type="number" />
          </div>
          <div class="space-y-2">
            <Label>发票状态</Label>
            <Select v-model="editingRecord.invoiceStatus">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_requested">未索取</SelectItem>
                <SelectItem value="received">已到票</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>发票类型</Label>
            <Select v-model="editingRecord.invoiceType">
              <SelectTrigger>
                <SelectValue placeholder="选择发票类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem v-for="type in invoiceTypes" :key="type" :value="type">
                    {{ type }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>报销/转账状态</Label>
            <Select v-model="editingRecord.reimbursementStatus">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="advanced">已垫付(待报销)</SelectItem>
                <SelectItem value="pending_approval">报销审批中</SelectItem>
                <SelectItem value="settled">公司已打款(已结清)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label>备注</Label>
            <Textarea v-model="editingRecord.remark" rows="2" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="editDialogOpen = false">取消</Button>
          <Button @click="saveEdit">保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>