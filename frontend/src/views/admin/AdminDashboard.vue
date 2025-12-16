<template>
  <div class="admin-dashboard">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="240px" class="sidebar">
        <div class="logo">
          <h2>📚 管理后台</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="admin-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          @select="handleMenuSelect"
        >
          <el-menu-item index="dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据概览</span>
          </el-menu-item>
          <el-menu-item index="publications">
            <el-icon><Reading /></el-icon>
            <span>出版物管理</span>
          </el-menu-item>
          <el-menu-item index="readers">
            <el-icon><User /></el-icon>
            <span>读者管理</span>
          </el-menu-item>
          <el-menu-item index="borrows">
            <el-icon><Document /></el-icon>
            <span>借阅管理</span>
          </el-menu-item>
          <el-menu-item index="reservations">
            <el-icon><Clock /></el-icon>
            <span>预约管理</span>
          </el-menu-item>
          <el-menu-item index="fines">
            <el-icon><Money /></el-icon>
            <span>罚款管理</span>
          </el-menu-item>
          <el-menu-item index="categories">
            <el-icon><Folder /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-menu-item index="statistics">
            <el-icon><TrendCharts /></el-icon>
            <span>统计报表</span>
          </el-menu-item>
          <el-menu-item index="settings" v-if="authStore.isSuperAdmin">
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <span class="page-title">{{ pageTitle }}</span>
          </div>
          <div class="header-right">
            <el-tag :type="authStore.isSuperAdmin ? 'danger' : 'warning'" size="large">
              {{ authStore.isSuperAdmin ? '超级管理员' : '管理员' }}
            </el-tag>
            <span class="user-name">
              <el-icon><User /></el-icon>
              {{ authStore.user?.name }}
            </span>
            <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main">
          <!-- 数据概览 -->
          <div v-if="activeMenu === 'dashboard'" class="dashboard-content">
            <div class="welcome">
              <h1>欢迎回来，{{ authStore.user?.name }}！</h1>
              <p class="welcome-desc">这是您的管理控制面板</p>
            </div>

            <el-row :gutter="20" class="stats-row">
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card stat-card-blue">
                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon size="50"><Reading /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ stats.totalPublications }}</div>
                      <div class="stat-label">出版物总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card stat-card-green">
                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon size="50"><User /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ stats.totalReaders }}</div>
                      <div class="stat-label">读者总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card stat-card-orange">
                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon size="50"><Document /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ stats.totalBorrows }}</div>
                      <div class="stat-label">借阅总数</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :span="6">
                <el-card shadow="hover" class="stat-card stat-card-red">
                  <div class="stat-item">
                    <div class="stat-icon">
                      <el-icon size="50"><Warning /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">{{ stats.overdueCount }}</div>
                      <div class="stat-label">逾期数量</div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <!-- 快速操作 -->
            <el-card class="quick-actions-card">
              <template #header>
                <div class="card-header">
                  <span>快速操作</span>
                </div>
              </template>
              <el-row :gutter="15">
                <el-col :span="6">
                  <el-button type="primary" class="action-btn" @click="activeMenu = 'publications'">
                    <el-icon><Reading /></el-icon>
                    <span>管理出版物</span>
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="success" class="action-btn" @click="activeMenu = 'readers'">
                    <el-icon><User /></el-icon>
                    <span>管理读者</span>
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="warning" class="action-btn" @click="activeMenu = 'borrows'">
                    <el-icon><Document /></el-icon>
                    <span>处理借阅</span>
                  </el-button>
                </el-col>
                <el-col :span="6">
                  <el-button type="info" class="action-btn" @click="activeMenu = 'statistics'">
                    <el-icon><TrendCharts /></el-icon>
                    <span>查看报表</span>
                  </el-button>
                </el-col>
              </el-row>
            </el-card>

            <!-- 超级管理员功能 -->
            <el-card class="admin-tools-card" v-if="authStore.isSuperAdmin">
              <template #header>
                <div class="card-header">
                  <span>超级管理员工具</span>
                  <el-tag type="danger" size="small">高级功能</el-tag>
                </div>
              </template>
              <el-space wrap :size="15">
                <el-button type="primary" plain @click="handleExportData">
                  <el-icon><Download /></el-icon>
                  导出数据
                </el-button>
                <el-button type="danger" plain @click="handleClearData">
                  <el-icon><Delete /></el-icon>
                  清空数据
                </el-button>
                <el-button type="info" plain @click="activeMenu = 'settings'">
                  <el-icon><Setting /></el-icon>
                  系统设置
                </el-button>
              </el-space>
            </el-card>
          </div>

          <!-- 出版物管理 -->
          <PublicationManage v-else-if="activeMenu === 'publications'" />

          <!-- 读者管理 -->
          <ReaderManage v-else-if="activeMenu === 'readers'" />

          <!-- 借阅管理 -->
          <BorrowManage v-else-if="activeMenu === 'borrows'" />

          <!-- 预约管理 -->
          <ReservationManage v-else-if="activeMenu === 'reservations'" />

          <!-- 其他页面内容 -->
          <div v-else class="page-content">
            <el-result icon="info" title="功能开发中" sub-title="该功能正在开发中，敬请期待">
              <template #extra>
                <el-button type="primary" @click="activeMenu = 'dashboard'">返回首页</el-button>
              </template>
            </el-result>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Database, TABLES } from '@/services/database'
import { ElMessage, ElMessageBox } from 'element-plus'
import PublicationManage from './PublicationManage.vue'
import ReaderManage from './ReaderManage.vue'
import BorrowManage from './BorrowManage.vue'
import ReservationManage from './ReservationManage.vue'

const router = useRouter()
const authStore = useAuthStore()

const activeMenu = ref('dashboard')

const stats = ref({
  totalPublications: 0,
  totalReaders: 0,
  totalBorrows: 0,
  overdueCount: 0
})

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    dashboard: '数据概览',
    publications: '出版物管理',
    readers: '读者管理',
    borrows: '借阅管理',
    reservations: '预约管理',
    fines: '罚款管理',
    categories: '分类管理',
    statistics: '统计报表',
    settings: '系统设置'
  }
  return titles[activeMenu.value] || '管理后台'
})

onMounted(() => {
  loadStats()
})

const loadStats = () => {
  stats.value.totalPublications = Database.getAll(TABLES.PUBLICATIONS).length
  stats.value.totalReaders = Database.getAll(TABLES.READERS).length
  stats.value.totalBorrows = Database.getAll(TABLES.BORROW_RECORDS).length
  
  const borrows = Database.getAll(TABLES.BORROW_RECORDS)
  stats.value.overdueCount = borrows.filter((b: any) => b.status === 'overdue').length
}

const handleMenuSelect = (index: string) => {
  activeMenu.value = index
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    authStore.logout()
    ElMessage.success('已退出登录')
    await router.push('/login')
    // 强制刷新页面以确保状态完全清除
    window.location.reload()
  } catch {
    // 用户取消
  }
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    await handleLogout()
  } else if (command === 'profile') {
    ElMessage.info('个人信息功能开发中...')
  }
}

const handleExportData = () => {
  try {
    const data = Database.exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `library-data-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('数据导出失败')
  }
}

const handleClearData = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将清空所有数据（除默认管理员外），是否继续？',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    Database.clearAll()
    ElMessage.success('数据已清空')
    loadStats()
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: #f0f2f5;
}

/* 侧边栏样式 */
.sidebar {
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.admin-menu {
  border-right: none;
}

.admin-menu .el-menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.admin-menu .el-menu-item.is-active {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* 顶部导航栏 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 24px;
}

.header-left .page-title {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  color: white;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  backdrop-filter: blur(10px);
}

/* 主内容区 */
.main {
  padding: 24px;
  background: #f0f2f5;
}

.dashboard-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.welcome {
  margin-bottom: 24px;
}

.welcome h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 600;
}

.welcome-desc {
  font-size: 14px;
  color: #999;
}

/* 统计卡片 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stat-card-green {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #333;
}

.stat-card-orange {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  color: #333;
}

.stat-card-red {
  background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  color: #333;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px;
}

.stat-icon {
  opacity: 0.9;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* 快速操作卡片 */
.quick-actions-card {
  margin-bottom: 24px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.action-btn {
  width: 100%;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
}

.action-btn .el-icon {
  font-size: 28px;
}

/* 管理员工具卡片 */
.admin-tools-card {
  border-radius: 8px;
  border: 2px dashed #ff4d4f;
}

/* 页面内容 */
.page-content {
  background: white;
  border-radius: 8px;
  padding: 40px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
