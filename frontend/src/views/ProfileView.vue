<template>
  <div class="profile-view">
    <el-card>
      <template #header>
        <h2>个人信息</h2>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ authStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ authStore.user?.name }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ authStore.user?.email }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ authStore.user?.phone }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag v-if="authStore.isSuperAdmin" type="danger">超级管理员</el-tag>
          <el-tag v-else-if="authStore.isAdmin" type="warning">管理员</el-tag>
          <el-tag v-else type="success">读者</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册日期">
          {{ formatDate(authStore.user?.registrationDate || '') }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="reader" class="reader-info">
        <h3>读者信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="借阅上限">{{ reader.borrowLimit }}</el-descriptions-item>
          <el-descriptions-item label="已借数量">{{ reader.borrowedCount }}</el-descriptions-item>
          <el-descriptions-item label="会员等级">{{ reader.membershipLevel }}</el-descriptions-item>
          <el-descriptions-item label="信用分数">
            <el-tag :type="reader.creditScore >= 80 ? 'success' : reader.creditScore >= 60 ? 'warning' : 'danger'">
              {{ reader.creditScore }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="罚款总额">
            ¥{{ reader.totalFines.toFixed(2) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { UserService } from '@/services/userService'
import type { Reader } from '@/types/models'

const authStore = useAuthStore()
const reader = ref<Reader | null>(null)

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  if (authStore.user) {
    reader.value = UserService.getReaderByUserId(authStore.user.userId)
  }
})
</script>

<style scoped>
.profile-view {
  padding: 20px;
}

.reader-info {
  margin-top: 30px;
}

.reader-info h3 {
  margin-bottom: 15px;
}
</style>
