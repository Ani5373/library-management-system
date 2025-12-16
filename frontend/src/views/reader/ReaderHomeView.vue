<template>
  <div class="reader-home">
    <el-container>
      <!-- 顶部导航栏 -->
      <el-header class="header">
        <div class="header-content">
          <h2>图书馆管理系统</h2>
          <div class="user-info">
            <span>欢迎，{{ authStore.user?.name }}</span>
            <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
          </div>
        </div>
      </el-header>

      <el-container>
        <!-- 侧边栏 -->
        <el-aside width="200px" class="sidebar">
          <el-menu :default-active="activeMenu" @select="handleMenuSelect">
            <el-menu-item index="home">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            <el-menu-item index="search">
              <el-icon><Search /></el-icon>
              <span>搜索图书</span>
            </el-menu-item>
            <el-menu-item index="borrow">
              <el-icon><Reading /></el-icon>
              <span>我的借阅</span>
            </el-menu-item>
            <el-menu-item index="reservation">
              <el-icon><Clock /></el-icon>
              <span>我的预约</span>
            </el-menu-item>
            <el-menu-item index="profile">
              <el-icon><User /></el-icon>
              <span>个人信息</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { HomeFilled, Search, Reading, Clock, User } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const activeMenu = ref('home')

const handleMenuSelect = (index: string) => {
  activeMenu.value = index
  router.push(`/reader/${index}`)
}

const handleLogout = async () => {
  authStore.logout()
  ElMessage.success('已退出登录')
  await router.push('/login')
  // 强制刷新页面以确保状态完全清除
  window.location.reload()
}
</script>

<style scoped>
.reader-home {
  height: 100vh;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0;
  font-size: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info span {
  font-size: 14px;
  font-weight: 500;
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

.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
