<template>
  <div class="my-fines-view">
    <el-card>
      <template #header>
        <h2>我的罚款</h2>
      </template>

      <el-empty v-if="fines.length === 0" description="暂无罚款记录" />

      <el-table v-else :data="fines" stripe>
        <el-table-column prop="reason" label="原因" min-width="200" />
        <el-table-column label="金额" width="100">
          <template #default="{ row }">
            ¥{{ row.amount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column label="开具日期" width="150">
          <template #default="{ row }">
            {{ formatDate(row.issueDate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'unpaid'" type="danger">未支付</el-tag>
            <el-tag v-else-if="row.status === 'paid'" type="success">已支付</el-tag>
            <el-tag v-else type="info">已减免</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'unpaid'"
              type="primary"
              size="small"
              @click="handlePay(row)"
            >
              支付
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
import { FineService } from '@/services/fineService'
import { UserService } from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import type { Fine } from '@/types/models'

const authStore = useAuthStore()
const fines = ref<Fine[]>([])

const loadFines = () => {
  if (!authStore.user) return

  const reader = UserService.getReaderByUserId(authStore.user.userId)
  if (reader) {
    fines.value = FineService.getReaderFines(reader.readerId)
  }
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const handlePay = (fine: Fine) => {
  const result = FineService.payFine(fine.fineId)
  if (result.success) {
    ElMessage.success(result.message)
    loadFines()
  } else {
    ElMessage.error(result.message)
  }
}

onMounted(() => {
  loadFines()
})
</script>

<style scoped>
.my-fines-view {
  padding: 20px;
}
</style>
