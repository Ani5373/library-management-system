<template>
  <el-container class="main-layout">
    <el-header class="header">
      <div class="header-left">
        <h2>图书馆管理系统</h2>
      </div>
      <div class="header-right">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="notification-badge">
          <el-button :icon="Bell" circle @click="showNotifications" />
        </el-badge>
        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32">{{ userInitial }}</el-avatar>
            <span class="username">{{ authStore.user?.name }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人信息</el-dropdown-item>
              <el-dropdown-item command="password">修改密码</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <el-container>
      <el-aside width="200px" class="sidebar">
        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>

          <el-menu-item index="/search">
            <el-icon><Search /></el-icon>
            <span>搜索出版物</span>
          </el-menu-item>

          <el-menu-item index="/my-borrows">
            <el-icon><Reading /></el-icon>
            <span>我的借阅</span>
          </el-menu-item>

          <el-menu-item index="/my-reservations">
            <el-icon><Clock /></el-icon>
            <span>我的预约</span>
          </el-menu-item>

          <el-menu-item index="/my-fines">
            <el-icon><Money /></el-icon>
            <span>我的罚款</span>
          </el-menu-item>

          <el-sub-menu index="admin" v-if="authStore.isAdmin || authStore.isSuperAdmin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理功能</span>
            </template>
            <el-menu-item index="/admin/publications">出版物管理</el-menu-item>
            <el-menu-item index="/admin/readers">读者管理</el-menu-item>
            <el-menu-item index="/admin/borrows">借阅管理</el-menu-item>
            <el-menu-item index="/admin/statistics">统计报表</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="superadmin" v-if="authStore.isSuperAdmin">
            <template #title>
              <el-icon><Tools /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/admin/admins">管理员管理</el-menu-item>
            <el-menu-item index="/admin/config">系统配置</el-menu-item>
            <el-menu-item index="/admin/backup">数据备份</el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-aside>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  House,
  Search,
  Reading,
  Clock,
  Money,
  Setting,
  Tools,
  Bell
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { NotificationService } from '@/services/notificationService'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const unreadCount = ref(0)

const activeMenu = computed(() => route.path)

const userInitial = computed(() => {
  return authStore.user?.name?.charAt(0) || 'U'
})

const loadUnreadCount = () => {
  if (authStore.user) {
    unreadCount.value = NotificationService.getUnreadCount(authStore.user.userId)
  }
}

onMounted(() => {
  loadUnreadCount()
})

const handleCommand = (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'password':
      router.push('/change-password')
      break
    case 'logout':
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

const showNotifications = () => {
  router.push('/notifications')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-right :deep(.el-button) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.header-right :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.4);
}

.notification-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.username {
  color: white;
}

.sidebar {
  background: linear-gradient(180deg, #f5f7fa 0%, #e8eaf6 100%);
  border-right: 1px solid #e4e7ed;
}

.sidebar :deep(.el-menu-item:hover) {
  background-color: rgba(102, 126, 234, 0.1) !important;
}

.sidebar :deep(.el-menu-item.is-active) {
  background-color: rgba(102, 126, 234, 0.15) !important;
  color: #667eea !important;
  border-right: 3px solid #667eea;
}

.sidebar :deep(.el-sub-menu__title:hover) {
  background-color: rgba(102, 126, 234, 0.1) !important;
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
