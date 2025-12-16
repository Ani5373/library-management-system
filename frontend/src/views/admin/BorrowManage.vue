<template>
  <div class="borrow-manage">
    <div class="page-header">
      <h2>借阅管理</h2>
      <el-button type="primary" @click="showBorrowDialog = true">
        <el-icon><Plus /></el-icon>
        办理借阅
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value">{{ stats.totalBorrows }}</div>
            <div class="stat-label">总借阅数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value" style="color: #409eff">{{ stats.borrowing }}</div>
            <div class="stat-label">借阅中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value" style="color: #f56c6c">{{ stats.overdue }}</div>
            <div class="stat-label">已逾期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-box">
            <div class="stat-value" style="color: #67c23a">{{ stats.returned }}</div>
            <div class="stat-label">已归还</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="读者姓名">
          <el-input v-model="searchForm.readerName" placeholder="请输入读者姓名" clearable />
        </el-form-item>
        <el-form-item label="出版物标题">
          <el-input v-model="searchForm.publicationTitle" placeholder="请输入出版物标题" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="全部" value="" />
            <el-option label="借阅中" value="borrowed" />
            <el-option label="已归还" value="returned" />
            <el-option label="已逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 借阅记录列表 -->
    <el-card class="table-card">
      <el-table :data="filteredBorrows" stripe style="width: 100%">
        <el-table-column prop="readerName" label="读者" width="120" />
        <el-table-column prop="publicationTitle" label="出版物" width="200" />
        <el-table-column prop="borrowDate" label="借阅日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.borrowDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="应还日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="returnDate" label="归还日期" width="120">
          <template #default="{ row }">
            {{ row.returnDate ? formatDate(row.returnDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="renewalCount" label="续借次数" width="100">
          <template #default="{ row }">
            {{ row.renewalCount }} / {{ row.maxRenewals }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'borrowed' || row.status === 'overdue'"
              type="success"
              size="small"
              @click="handleReturn(row)"
            >
              归还
            </el-button>
            <el-button
              v-if="row.status === 'borrowed' && row.renewalCount < row.maxRenewals"
              type="warning"
              size="small"
              @click="handleRenew(row)"
            >
              续借
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 办理借阅对话框 -->
    <el-dialog v-model="showBorrowDialog" title="办理借阅" width="500px">
      <el-form :model="borrowForm" :rules="borrowRules" ref="borrowFormRef" label-width="100px">
        <el-form-item label="读者" prop="readerId">
          <el-select v-model="borrowForm.readerId" placeholder="请选择读者" filterable>
            <el-option
              v-for="reader in readers"
              :key="reader.readerId"
              :label="`${reader.name} (${reader.username})`"
              :value="reader.readerId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="出版物" prop="publicationId">
          <el-select v-model="borrowForm.publicationId" placeholder="请选择出版物" filterable>
            <el-option
              v-for="pub in availablePublications"
              :key="pub.publicationId"
              :label="`${pub.title} (可借: ${pub.availableCopies})`"
              :value="pub.publicationId"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBorrowDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitBorrow">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { Database, TABLES } from '@/services/database'
import { CryptoUtils } from '@/utils/crypto'
import type { BorrowRecord, Reader, User, Publication, Fine } from '@/types/models'
import type { FormInstance, FormRules } from 'element-plus'

const showBorrowDialog = ref(false)
const borrowFormRef = ref<FormInstance>()
const borrows = ref<any[]>([])
const readers = ref<Array<Reader & User>>([])
const publications = ref<Publication[]>([])

const stats = ref({
  totalBorrows: 0,
  borrowing: 0,
  overdue: 0,
  returned: 0
})

const searchForm = reactive({
  readerName: '',
  publicationTitle: '',
  status: ''
})

const borrowForm = reactive({
  readerId: '',
  publicationId: ''
})

const borrowRules: FormRules = {
  readerId: [{ required: true, message: '请选择读者', trigger: 'change' }],
  publicationId: [{ required: true, message: '请选择出版物', trigger: 'change' }]
}

const availablePublications = computed(() => {
  return publications.value.filter(p => p.availableCopies > 0)
})

const filteredBorrows = computed(() => {
  let result = borrows.value
  if (searchForm.readerName) {
    result = result.filter(b => b.readerName.includes(searchForm.readerName))
  }
  if (searchForm.publicationTitle) {
    result = result.filter(b => b.publicationTitle.includes(searchForm.publicationTitle))
  }
  if (searchForm.status) {
    result = result.filter(b => b.status === searchForm.status)
  }
  return result
})

onMounted(() => {
  loadData()
})

const loadData = () => {
  loadBorrows()
  loadReaders()
  loadPublications()
  calculateStats()
}

const loadBorrows = () => {
  const allBorrows = Database.getAll<BorrowRecord>(TABLES.BORROW_RECORDS)
  const allReaders = Database.getAll<Reader>(TABLES.READERS)
  const allUsers = Database.getAll<User>(TABLES.USERS)
  const allPublications = Database.getAll<Publication>(TABLES.PUBLICATIONS)
  
  borrows.value = allBorrows.map(borrow => {
    const reader = allReaders.find(r => r.readerId === borrow.readerId)
    const user = allUsers.find(u => u.userId === reader?.userId)
    const pub = allPublications.find(p => p.publicationId === borrow.publicationId)
    
    // 检查是否逾期
    let status = borrow.status
    if (status === 'borrowed' && new Date(borrow.dueDate) < new Date() && !borrow.returnDate) {
      status = 'overdue'
      Database.update<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', borrow.recordId, {
        status: 'overdue'
      })
    }
    
    return {
      ...borrow,
      status,
      readerName: user?.name || '未知',
      publicationTitle: pub?.title || '未知'
    }
  })
}

const loadReaders = () => {
  const allReaders = Database.getAll<Reader>(TABLES.READERS)
  const allUsers = Database.getAll<User>(TABLES.USERS)
  
  readers.value = allReaders.map(reader => {
    const user = allUsers.find(u => u.userId === reader.userId)
    return { ...reader, ...user } as Reader & User
  })
}

const loadPublications = () => {
  publications.value = Database.getAll<Publication>(TABLES.PUBLICATIONS)
}

const calculateStats = () => {
  const allBorrows = Database.getAll<BorrowRecord>(TABLES.BORROW_RECORDS)
  stats.value.totalBorrows = allBorrows.length
  stats.value.borrowing = allBorrows.filter(b => b.status === 'borrowed').length
  stats.value.overdue = allBorrows.filter(b => b.status === 'overdue').length
  stats.value.returned = allBorrows.filter(b => b.status === 'returned').length
}

const handleSearch = () => {
  // 搜索已通过 computed 实现
}

const handleReset = () => {
  searchForm.readerName = ''
  searchForm.publicationTitle = ''
  searchForm.status = ''
}

const handleSubmitBorrow = async () => {
  if (!borrowFormRef.value) return
  
  await borrowFormRef.value.validate(async valid => {
    if (!valid) return
    
    const reader = readers.value.find(r => r.readerId === borrowForm.readerId)
    const publication = publications.value.find(p => p.publicationId === borrowForm.publicationId)
    
    if (!reader || !publication) {
      ElMessage.error('数据错误')
      return
    }
    
    // 检查借阅资格
    if (reader.borrowedCount >= reader.borrowLimit) {
      ElMessage.error('读者已达借阅上限')
      return
    }
    
    if (reader.creditScore < 60) {
      ElMessage.error('读者信用分数不足')
      return
    }
    
    if (publication.availableCopies <= 0) {
      ElMessage.error('该出版物暂无可借')
      return
    }
    
    // 创建借阅记录
    const borrowDate = new Date()
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + publication.borrowPeriod)
    
    const borrowRecord: BorrowRecord = {
      recordId: CryptoUtils.generateId('borrow'),
      readerId: borrowForm.readerId,
      publicationId: borrowForm.publicationId,
      borrowDate: borrowDate.toISOString(),
      dueDate: dueDate.toISOString(),
      returnDate: null,
      status: 'borrowed',
      renewalCount: 0,
      maxRenewals: 2
    }
    
    Database.insert(TABLES.BORROW_RECORDS, borrowRecord)
    
    // 更新出版物可借数量
    Database.update<Publication>(TABLES.PUBLICATIONS, 'publicationId', borrowForm.publicationId, {
      availableCopies: publication.availableCopies - 1
    })
    
    // 更新读者借阅数量
    Database.update<Reader>(TABLES.READERS, 'readerId', borrowForm.readerId, {
      borrowedCount: reader.borrowedCount + 1
    })
    
    ElMessage.success('借阅办理成功')
    showBorrowDialog.value = false
    borrowForm.readerId = ''
    borrowForm.publicationId = ''
    loadData()
  })
}

const handleReturn = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要办理归还吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    const returnDate = new Date()
    const dueDate = new Date(row.dueDate)
    const isOverdue = returnDate > dueDate
    
    // 更新借阅记录
    Database.update<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', row.recordId, {
      returnDate: returnDate.toISOString(),
      status: 'returned'
    })
    
    // 更新出版物可借数量
    const publication = publications.value.find(p => p.publicationId === row.publicationId)
    if (publication) {
      Database.update<Publication>(TABLES.PUBLICATIONS, 'publicationId', row.publicationId, {
        availableCopies: publication.availableCopies + 1
      })
    }
    
    // 更新读者借阅数量
    const reader = readers.value.find(r => r.readerId === row.readerId)
    if (reader) {
      Database.update<Reader>(TABLES.READERS, 'readerId', row.readerId, {
        borrowedCount: reader.borrowedCount - 1
      })
      
      // 如果逾期，生成罚款并减少信用分数
      if (isOverdue) {
        const overdueDays = Math.ceil((returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        const fineAmount = overdueDays * 0.5
        
        const fine: Fine = {
          fineId: CryptoUtils.generateId('fine'),
          readerId: row.readerId,
          borrowRecordId: row.recordId,
          amount: fineAmount,
          reason: `逾期 ${overdueDays} 天`,
          issueDate: returnDate.toISOString(),
          paymentDate: null,
          status: 'unpaid'
        }
        
        Database.insert(TABLES.FINES, fine)
        
        Database.update<Reader>(TABLES.READERS, 'readerId', row.readerId, {
          totalFines: reader.totalFines + fineAmount,
          creditScore: Math.max(0, reader.creditScore - overdueDays * 2)
        })
        
        ElMessage.warning(`归还成功，但已逾期 ${overdueDays} 天，产生罚款 ¥${fineAmount.toFixed(2)}`)
      } else {
        // 按时归还，增加信用分数
        Database.update<Reader>(TABLES.READERS, 'readerId', row.readerId, {
          creditScore: Math.min(200, reader.creditScore + 1)
        })
        ElMessage.success('归还成功')
      }
    }
    
    loadData()
  } catch {
    // 用户取消
  }
}

const handleRenew = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要续借吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    const publication = publications.value.find(p => p.publicationId === row.publicationId)
    if (!publication) return
    
    const newDueDate = new Date(row.dueDate)
    newDueDate.setDate(newDueDate.getDate() + publication.borrowPeriod)
    
    Database.update<BorrowRecord>(TABLES.BORROW_RECORDS, 'recordId', row.recordId, {
      dueDate: newDueDate.toISOString(),
      renewalCount: row.renewalCount + 1
    })
    
    ElMessage.success('续借成功')
    loadData()
  } catch {
    // 用户取消
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getStatusType = (status: string) => {
  const types: Record<string, any> = {
    borrowed: 'primary',
    returned: 'success',
    overdue: 'danger'
  }
  return types[status] || 'info'
}

const getStatusName = (status: string) => {
  const names: Record<string, string> = {
    borrowed: '借阅中',
    returned: '已归还',
    overdue: '已逾期'
  }
  return names[status] || status
}
</script>

<style scoped>
.borrow-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-box {
  text-align: center;
  padding: 10px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}
</style>
