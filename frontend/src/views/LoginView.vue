<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="title">图书馆管理系统</h1>
      <p class="subtitle">Library Management System</p>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="读者登录" name="reader">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入用户名"
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="login-button"
              >
                登录
              </el-button>
            </el-form-item>
            <el-form-item>
              <el-button size="large" @click="handleRegister" class="register-button">
                注册新账户
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="管理员登录" name="admin">
          <el-form :model="loginForm" :rules="rules" ref="adminFormRef" class="login-form">
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入管理员账号"
                prefix-icon="User"
                size="large"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                size="large"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="login-button"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
          <div class="admin-hint">
            <el-text type="info" size="small">
              默认管理员账号：admin / admin123
            </el-text>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="demo-data">
        <el-button text @click="showDemoAccounts = !showDemoAccounts">
          {{ showDemoAccounts ? '隐藏' : '查看' }}演示账号
        </el-button>
        <div v-if="showDemoAccounts" class="demo-accounts">
          <p><strong>管理员：</strong>admin / admin123</p>
          <p><strong>读者：</strong>可以注册新账户</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('reader')
const loading = ref(false)
const showDemoAccounts = ref(false)
const loginFormRef = ref<FormInstance>()
const adminFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  const formRef = activeTab.value === 'admin' ? adminFormRef.value : loginFormRef.value
  if (!formRef) return

  await formRef.validate(async valid => {
    if (!valid) return

    loading.value = true
    try {
      const response = await authStore.login({
        username: loginForm.username,
        password: loginForm.password
      })

      if (response.success) {
        // 验证角色是否匹配登录标签页
        const isAdminTab = activeTab.value === 'admin'
        const isAdminUser = authStore.isAdmin || authStore.isSuperAdmin
        
        if (isAdminTab && !isAdminUser) {
          // 在管理员标签页登录，但不是管理员账户
          authStore.logout()
          ElMessage.error('该账户不是管理员，请使用读者登录')
          loading.value = false
          return
        }
        
        if (!isAdminTab && isAdminUser) {
          // 在读者标签页登录，但是管理员账户
          authStore.logout()
          ElMessage.error('该账户是管理员，请使用管理员登录')
          loading.value = false
          return
        }
        
        ElMessage.success(response.message)
        // 根据角色跳转到不同页面
        if (authStore.isAdmin || authStore.isSuperAdmin) {
          router.push('/admin/dashboard')
        } else {
          router.push('/reader/home')
        }
      } else {
        ElMessage.error(response.message)
      }
    } catch (error) {
      ElMessage.error('登录失败，请重试')
    } finally {
      loading.value = false
    }
  })
}

const handleRegister = () => {
  router.push('/register')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-box {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.title {
  text-align: center;
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  text-align: center;
  font-size: 14px;
  color: #999;
  margin-bottom: 30px;
}

.login-tabs {
  margin-bottom: 20px;
}

.login-form {
  margin-top: 20px;
}

.login-button,
.register-button {
  width: 100%;
}

.admin-hint {
  text-align: center;
  margin-top: 10px;
}

.demo-data {
  margin-top: 20px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.demo-accounts {
  margin-top: 10px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: left;
}

.demo-accounts p {
  margin: 8px 0;
  font-size: 14px;
  color: #666;
}
</style>
