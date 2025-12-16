<template>
  <div class="reader-home">
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <h2>图书馆管理系统</h2>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><User /></el-icon>
              {{ authStore.user?.name }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <div class="welcome">
          <h1>欢迎，{{ authStore.user?.name }}！</h1>
          <p>您当前是读者身份</p>
        </div>

        <el-row :gutter="20" class="stats">
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-item">
                <el-icon size="40" color="#409EFF"><Reading /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ readerInfo?.borrowedCount || 0 }}</div>
                  <div class="stat-label">当前借阅</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-item">
                <el-icon size="40" color="#67C23A"><Trophy /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ readerInfo?.creditScore || 100 }}</div>
                  <div class="stat-label">信用分数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-item">
                <el-icon size="40" color="#E6A23C"><Star /></el-icon>
                <div class="stat-info">
                  <div class="stat-value">{{ readerInfo?.membershipLevel || 'basic' }}</div>
                  <div class="stat-label">会员等级</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-card class="features">
          <h3>功能菜单</h3>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="feature-item">
                <el-icon size="50"><Search /></el-icon>
                <p>搜索图书</p>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="feature-item">
                <el-icon size="50"><Reading /></el-icon>
                <p>我的借阅</p>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="feature-item">
                <el-icon size="50"><Clock /></el-icon>
                <p>预约记录</p>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="feature-item">
                <el-icon size="50"><ChatDotRound /></el-icon>
                <p>我的评价</p>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Database, TABLES } from '@/services/database'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Reader } from '@/types/models'

const router = useRouter()
const authStore = useAuthStore()
const readerInfo = ref<Reader | null>(null)

onMounted(() => {
  loadReaderInfo()
})

const loadReaderInfo = () => {
  if (authStore.user) {
    const readers = Database.query<Reader>(
      TABLES.READERS,
      r => r.userId === authStore.user?.userId
    )
    if (readers.length > 0) {
      readerInfo.value = readers[0]
    }
  }
}

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消
    }
  } else if (command === 'profile') {
    ElMessage.info('个人信息功能开发中...')
  }
}
</script>

<style scoped>
.reader-home {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left h2 {
  margin: 0;
  color: #333;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #f5f7fa;
}

.main {
  padding: 30px;
}

.welcome {
  text-align: center;
  margin-bottom: 40px;
}

.welcome h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 10px;
}

.welcome p {
  font-size: 16px;
  color: #666;
}

.stats {
  margin-bottom: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.features h3 {
  margin-bottom: 20px;
  color: #333;
}

.feature-item {
  text-align: center;
  padding: 30px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: #f5f7fa;
  transform: translateY(-5px);
}

.feature-item p {
  margin-top: 15px;
  font-size: 16px;
  color: #666;
}
</style>
