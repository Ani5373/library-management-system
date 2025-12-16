<template>
  <div class="notifications-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>通知中心</h2>
          <el-button size="small" @click="clearRead">清空已读</el-button>
        </div>
      </template>

      <el-empty v-if="notifications.length === 0" description="暂无通知" />

      <div v-else class="notification-list">
        <div
          v-for="notif in notifications"
          :key="notif.notificationId"
          class="notification-item"
          :class="{ unread: !notif.isRead }"
          @click="markAsRead(notif)"
        >
          <div class="notification-content">
            <div class="notification-header">
              <span class="notification-title">{{ notif.title }}</span>
              <span class="notification-time">{{ formatDate(notif.sendDate) }}</span>
            </div>
            <div class="notification-body">{{ notif.content }}</div>
          </div>
          <el-badge is-dot v-if="!notif.isRead" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { NotificationService } from '@/services/notificationService'
import { useAuthStore } from '@/stores/auth'
import type { Notification } from '@/types/models'

const authStore = useAuthStore()
const notifications = ref<Notification[]>([])

const loadNotifications = () => {
  if (authStore.user) {
    notifications.value = NotificationService.getUserNotifications(authStore.user.userId)
  }
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const markAsRead = (notif: Notification) => {
  if (!notif.isRead) {
    NotificationService.markAsRead(notif.notificationId)
    loadNotifications()
  }
}

const clearRead = () => {
  if (authStore.user) {
    const count = NotificationService.clearReadNotifications(authStore.user.userId)
    ElMessage.success(`已清空 ${count} 条已读通知`)
    loadNotifications()
  }
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-view {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-radius: 4px;
  background: #f5f7fa;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #e4e7ed;
}

.notification-item.unread {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.notification-title {
  font-weight: bold;
  color: #303133;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-body {
  color: #606266;
  font-size: 14px;
}
</style>
