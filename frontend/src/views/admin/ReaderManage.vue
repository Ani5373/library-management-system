<template>
  <div class="reader-manage">
    <div class="page-header">
      <h2>读者管理</h2>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="姓名">
          <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 读者列表 -->
    <el-card class="table-card">
      <el-table :data="filteredReaders" stripe style="width: 100%">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="borrowedCount" label="当前借阅" width="100">
          <template #default="{ row }">
            {{ row.borrowedCount }} / {{ row.borrowLimit }}
          </template>
        </el-table-column>
        <el-table-column prop="creditScore" label="信用分数" width="100">
          <template #default="{ row }">
            <el-tag :type="getCreditScoreType(row.creditScore)">
              {{ row.creditScore }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="membershipLevel" label="会员等级" width="100" />
        <el-table-column prop="totalFines" label="待缴罚款" width="100">
          <template #default="{ row }">
            ¥{{ row.totalFines.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
            <el-button type="warning" size="small" @click="handleEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 读者详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="读者详情" width="800px">
      <div v-if="currentReader">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ currentReader.name }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentReader.username }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ currentReader.email }}</el-descriptions-item>
          <el-descriptions-item label="电话">{{ currentReader.phone }}</el-descriptions-item>
          <el-descriptions-item label="注册日期">
            {{ formatDate(currentReader.registrationDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录">
            {{ formatDate(currentReader.lastLoginTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="借阅上限">
            {{ currentReader.borrowLimit }}
          </el-descriptions-item>
          <el-descriptions-item label="当前借阅">
            {{ currentReader.borrowedCount }}
          </el-descriptions-item>
          <el-descriptions-item label="信用分数">
            {{ currentReader.creditScore }}
          </el-descriptions-item>
          <el-descriptions-item label="会员等级">
            {{ currentReader.membershipLevel }}
          </el-descriptions-item>
          <el-descriptions-item label="待缴罚款">
            ¥{{ currentReader.totalFines.toFixed(2) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <h3>借阅历史</h3>
        <el-table :data="readerBorrows" stripe style="width: 100%">
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
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusName(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑读者信息" width="500px">
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="100px">
        <el-form-item label="借阅上限" prop="borrowLimit">
          <el-input-number v-model="editForm.borrowLimit" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="信用分数" prop="creditScore">
          <el-input-number v-model="editForm.creditScore" :min="0" :max="200" />
        </el-form-item>
        <el-form-item label="会员等级" prop="membershipLevel">
          <el-select v-model="editForm.membershipLevel">
            <el-option label="基础会员" value="basic" />
            <el-option label="银卡会员" value="silver" />
            <el-option label="金卡会员" value="gold" />
            <el-option label="白金会员" value="platinum" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Database, TABLES } from '@/services/database'
import type { Reader, User, BorrowRecord, Publication } from '@/types/models'
import type { FormInstance, FormRules } from 'element-plus'

const showDetailDialog = ref(false)
const showEditDialog = ref(false)
const editFormRef = ref<FormInstance>()
const readers = ref<Array<Reader & User>>([])
const currentReader = ref<(Reader & User) | null>(null)
const readerBorrows = ref<any[]>([])

const searchForm = reactive({
  name: '',
  username: ''
})

const editForm = reactive({
  readerId: '',
  borrowLimit: 7,
  creditScore: 100,
  membershipLevel: 'basic'
})

const editRules: FormRules = {
  borrowLimit: [{ required: true, message: '请输入借阅上限', trigger: 'blur' }],
  creditScore: [{ required: true, message: '请输入信用分数', trigger: 'blur' }]
}

const filteredReaders = computed(() => {
  let result = readers.value
  if (searchForm.name) {
    result = result.filter(r => r.name.includes(searchForm.name))
  }
  if (searchForm.username) {
    result = result.filter(r => r.username.includes(searchForm.username))
  }
  return result
})

onMounted(() => {
  loadReaders()
})

const loadReaders = () => {
  const allReaders = Database.getAll<Reader>(TABLES.READERS)
  const allUsers = Database.getAll<User>(TABLES.USERS)
  
  readers.value = allReaders.map(reader => {
    const user = allUsers.find(u => u.userId === reader.userId)
    return { ...reader, ...user } as Reader & User
  })
}

const getCreditScoreType = (score: number) => {
  if (score >= 90) return 'success'
  if (score >= 60) return 'warning'
  return 'danger'
}

const handleSearch = () => {
  // 搜索已通过 computed 实现
}

const handleReset = () => {
  searchForm.name = ''
  searchForm.username = ''
}

const handleViewDetail = (row: Reader & User) => {
  currentReader.value = row
  loadReaderBorrows(row.readerId)
  showDetailDialog.value = true
}

const loadReaderBorrows = (readerId: string) => {
  const borrows = Database.query<BorrowRecord>(
    TABLES.BORROW_RECORDS,
    b => b.readerId === readerId
  )
  const publications = Database.getAll<Publication>(TABLES.PUBLICATIONS)
  
  readerBorrows.value = borrows.map(borrow => {
    const pub = publications.find(p => p.publicationId === borrow.publicationId)
    return {
      ...borrow,
      publicationTitle: pub?.title || '未知'
    }
  })
}

const handleEdit = (row: Reader & User) => {
  editForm.readerId = row.readerId
  editForm.borrowLimit = row.borrowLimit
  editForm.creditScore = row.creditScore
  editForm.membershipLevel = row.membershipLevel
  showEditDialog.value = true
}

const handleSubmitEdit = async () => {
  if (!editFormRef.value) return
  
  await editFormRef.value.validate(valid => {
    if (!valid) return
    
    Database.update<Reader>(TABLES.READERS, 'readerId', editForm.readerId, {
      borrowLimit: editForm.borrowLimit,
      creditScore: editForm.creditScore,
      membershipLevel: editForm.membershipLevel
    })
    
    ElMessage.success('编辑成功')
    showEditDialog.value = false
    loadReaders()
  })
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
.reader-manage {
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

.search-card {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}

h3 {
  margin: 20px 0 15px;
  font-size: 16px;
  color: #333;
}
</style>
