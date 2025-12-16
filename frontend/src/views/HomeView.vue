<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="24">
        <h1>欢迎回来，{{ authStore.user?.name }}</h1>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" :size="40" color="#409EFF"><Reading /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.borrowedCount }}</div>
              <div class="stat-label">当前借阅</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" :size="40" color="#67C23A"><Clock /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.reservationCount }}</div>
              <div class="stat-label">预约中</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" :size="40" color="#E6A23C"><Money /></el-icon>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.totalFines }}</div>
              <div class="stat-label">未付罚款</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon" :size="40" color="#F56C6C"><Star /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.creditScore }}</div>
              <div class="stat-label">信用分数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>热门出版物</span>
            </div>
          </template>
          <el-empty v-if="popularPublications.length === 0" description="暂无数据" />
          <div v-else class="publication-list">
            <div
              v-for="pub in popularPublications"
              :key="pub.publicationId"
              class="publication-item"
            >
              <div class="publication-info">
                <div class="publication-title">{{ pub.title }}</div>
                <div class="publication-author">{{ pub.author }}</div>
              </div>
              <el-tag>{{ pub.type === 'book' ? '图书' : pub.type === 'magazine' ? '期刊' : '电子书' }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新通知</span>
            </div>
          </template>
          <el-empty v-if="notifications.length === 0" description="暂无通知" />
          <div v-else class="notification-list">
            <div
              v-for="notif in notifications"
              :key="notif.notificationId"
              class="notification-item"
            >
              <div class="notification-content">
                <div class="notification-title">{{ notif.title }}</div>
                <div class="notification-time">
                  {{ formatDate(notif.sendDate) }}
                </div>
              </div>
              <el-badge is-dot v-if="!notif.isRead" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Reading, Clock, Money, Star } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { UserService } from '@/services/userService'
import { PublicationService } from '@/services/publicationService'
import { NotificationService } from '@/services/notificationService'
import type { Publication, Notification } from '@/types/models'

const authStore = useAuthStore()

const stats = ref({
  borrowedCount: 0,
  reservationCount: 0,
  totalFines: 0,
  creditScore: 100
})

const popularPublications = ref<Publication[]>([])
const notifications = ref<Notification[]>([])

const loadStats = () => {
  if (authStore.user) {
    const reader = UserService.getReaderByUserId(authStore.user.userId)
    if (reader) {
      stats.value = {
        borrowedCount: reader.borrowedCount,
        reservationCount: 0,
        totalFines: reader.totalFines,
        creditScore: reader.creditScore
      }
    }
  }
}

const loadPopularPublications = () => {
  const pubs = PublicationService.getAllPublications()
  popularPublications.value = pubs.slice(0, 5)
}

const loadNotifications = () => {
  if (authStore.user) {
    const notifs = NotificationService.getUserNotifications(authStore.user.userId)
    notifications.value = notifs.slice(0, 5)
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  loadStats()
  loadPopularPublications()
  loadNotifications()
})
</script>

<style scoped>
.home {
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.card-header {
  font-weight: bold;
}

.publication-list,
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.publication-item,
.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  background: #f5f7fa;
}

.publication-info,
.notification-content {
  flex: 1;
}

.publication-title,
.notification-title {
  font-weight: bold;
  color: #303133;
}

.publication-author,
.notification-time {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
