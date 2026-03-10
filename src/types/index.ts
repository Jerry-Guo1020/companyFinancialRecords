// 类型定义文件

// 账户类型
export interface Account {
  id: string
  name: string
  openingBalance: number  // 月初余额
  monthlyIncome: number   // 本月收入
  monthlyExpense: number  // 本月支出
}

// 收支记录
export interface FinancialRecord {
  id: string
  date: Date
  type: 'income' | 'expense'
  category: string      // 科目
  amount: number
  accountId: string     // 关联账户
  summary: string       // 摘要
  handler?: string      // 经手人
}

// 科目分类
export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
}

// 计算后的账户汇总
export interface AccountSummary extends Account {
  closingBalance: number  // 月末余额
}