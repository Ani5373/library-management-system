<template>
  <div class="borrow-page">
    <h1>我的借阅</h1>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="当前借阅" name="current">
        <el-table :data="currentBorrows" stripe>
          <el-table-column prop="publicationTitle" label="图书标题" width="200" />
          <el-table-column prop="borrowDate" label="借阅日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.borrowDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="dueDate" label="应还日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.dueDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="renewalCount" label="续借次数" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row)">
                {{ getStatusText(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                :disabled="row.renewalCount >= row.maxRenewals"
                @click="handleRenew(row)"
              >
                续借
              </el-button>
              <el-button type="success" size="small" @click="handleReturn(row)">
                归还
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="currentBorrows.length === 0" description="暂无借阅记录" />
      </el-tab-pane>

      <el-tab-pane label="历史记录" name="history">
        <el-table :data="historyBorrows" stripe>
          <el-table-column prop="publicationTitle" label="图书标题" width="200" />
          <el-table-column prop="borrowDate" label="借阅日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.borrowDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="returnDate" label="归还日期" width="150">
            <template #default="{ row }">
              {{ formatDate(row.returnDate) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag type="info">已归还</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="historyBorrows.length === 0" description="暂无历史记录" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Database, TABLES } from '@/services/database'
import { useAuthStore } from '@/stores/auth'
import type { BorrowRecord, Publication, Reader } from '@/types/models'

const authStore = useAuthStore()
const activeTab = ref('current')
const borrowRecords = ref<BorrowRecord[]>([])
const publications = ref<Publication[]>([])

interface BorrowRecordWithTitle extends BorrowRecord {
  publicationTitle: string
}

const currentBorrows = computed(() => {
  return borrowRecords.value
    .filter(record => record.status === 'borrowed' || record.status === 'overdue')
    .map(record => {
      const pub = publications.value.find(p => p.publicationId === record.publicationId)
      return {
        ...record,
        publicationTitle: pub?.title || '未知'
      } as BorrowRecordWithTitle
    })
})

const historyBorrows = computed(() => {
  return borrowRecords.value
    .filter(record => record.status === 'returned')
    .map(record => {
      const pub = publications.value.find(p => p.publicationId === record.publicationId)
      return {
        ...record,
        publicationTitle: pub?.title || '未知'
      } as BorrowRecordWithTitle
    })
})

onMounted(() => {
  loadBorrowRecords()
  loadPublications()
})

const loadBorrowRecords = () => {
  if (!authStore.user) return
  
  // 获取当前读者信息
  const readers = Database.query<Reader>(
    TABLES.READERS,
    r => r.userId === authStore.user?.userId
  )
  
  if (readers.length === 0) return
  
  const readerId = readers[0].readerId
  borrowRecords.value = Database.query<BorrowRecord>(
    TABLES.BORROW_RECORDS,
    record => record.readerId === readerId
  )
}

const loadPublications = () => {
  publications.value = Database.getAll<Publication>(TABLES.PUBLICATIONS)
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getStatusType = (record: BorrowRecord) => {
  if (record.status === 'overdue') return 'danger'
  const dueDate = new Date(record.dueDate)
  const now = new Date()
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 3) return 'warning'
  return 'success'
}

const getStatusText = (record: BorrowRecord) => {
  if (record.status === 'overdue') return '已逾期'
  const dueDate = new Date(record.dueDate)
  const now = new Date()
  const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return `剩余${daysLeft}天`
}

const handleRenew = (record: BorrowRecord) => {
  ElMessage.info('续借功能正在开发中...')
  // TODO: 实现续借逻辑
}

const handleReturn = (record: BorrowRecord) => {
  ElMessage.info('归还功能正在开发中...')
  // TODO: 实现归还逻辑
}
</script>

<style scoped>
.borrow-page {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  margin-bottom: 30px;
  color: #333;
}
</style>
