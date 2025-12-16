<template>
  <div class="my-borrows-view">
    <el-card>
      <template #header>
        <h2>我的借阅</h2>
      </template>

      <el-empty v-if="borrowRecords.length === 0" description="暂无借阅记录" />

      <el-table v-else :data="borrowRecords" stripe>
        <el-table-column label="出版物" min-width="200">
          <template #default="{ row }">
            {{ getPublicationTitle(row.publicationId) }}
          </template>
        </el-table-column>
        <el-table-column label="借阅日期" width="150">
          <template #default="{ row }">
            {{ formatDate(row.borrowDate) }}
          </template>
        </el-table-column>
        <el-table-column label="应还日期" width="150">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'borrowed'" type="warning">借阅中</el-tag>
            <el-tag v-else-if="row.status === 'returned'" type="success">已归还</el-tag>
            <el-tag v-else type="danger">已逾期</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="续借次数" width="100">
          <template #default="{ row }">
            {{ row.renewalCount }} / {{ row.maxRenewals }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'borrowed'"
              type="primary"
              size="small"
              @click="handleRenew(row)"
              :disabled="row.renewalCount >= row.maxRenewals"
            >
              续借
            </el-button>
            <el-button
              v-if="row.status === 'borrowed'"
              type="success"
              size="small"
              @click="handleReturn(row)"
            >
              归还
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { BorrowService } from '@/services/borrowService'
import { PublicationService } from '@/services/publicationService'
import { UserService } from '@/services/userService'
import { FineService } from '@/services/fineService'
import { useAuthStore } from '@/stores/auth'
import type { BorrowRecord } from '@/types/models'

const authStore = useAuthStore()
const borrowRecords = ref<BorrowRecord[]>([])

const loadBorrowRecords = () => {
  if (!authStore.user) return

  const reader = UserService.getReaderByUserId(authStore.user.userId)
  if (reader) {
    borrowRecords.value = BorrowService.getReaderBorrowRecords(reader.readerId)
  }
}

const getPublicationTitle = (publicationId: string): string => {
  const pub = PublicationService.getPublicationById(publicationId)
  return pub?.title || '未知'
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const handleRenew = (record: BorrowRecord) => {
  const result = BorrowService.renewBorrowRecord(record.recordId)
  if (result.success) {
    ElMessage.success(result.message)
    loadBorrowRecords()
  } else {
    ElMessage.error(result.message)
  }
}

const handleReturn = (record: BorrowRecord) => {
  const result = BorrowService.returnPublication(record.recordId)
  if (result.success) {
    ElMessage.success(result.message)

    // 如果逾期，创建罚款
    if (result.overdueDays && result.overdueDays > 0) {
      const reader = UserService.getReaderByUserId(authStore.user!.userId)
      if (reader) {
        FineService.createFine(
          reader.readerId,
          record.recordId,
          result.overdueDays,
          `逾期归还《${getPublicationTitle(record.publicationId)}》`
        )
      }
    }

    loadBorrowRecords()
  } else {
    ElMessage.error(result.message)
  }
}

onMounted(() => {
  loadBorrowRecords()
})
</script>

<style scoped>
.my-borrows-view {
  padding: 20px;
}
</style>
