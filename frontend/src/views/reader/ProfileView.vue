<template>
  <div class="profile-page">
    <h1>个人信息</h1>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>基本信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="用户名">
              {{ authStore.user?.username }}
            </el-descriptions-item>
            <el-descriptions-item label="姓名">
              {{ authStore.user?.name }}
            </el-descriptions-item>
            <el-descriptions-item label="邮箱">
              {{ authStore.user?.email }}
            </el-descriptions-item>
            <el-descriptions-item label="手机号">
              {{ authStore.user?.phone }}
            </el-descriptions-item>
            <el-descriptions-item label="注册日期">
              {{ formatDate(authStore.user?.registrationDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ formatDate(authStore.user?.lastLoginTime) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="info-card">
          <template #header>
            <div class="card-header">
              <span>读者信息</span>
            </div>
          </template>
          <el-descriptions :column="1" border v-if="readerInfo">
            <el-descriptions-item label="会员等级">
              <el-tag type="success">{{ readerInfo.membershipLevel }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="信用分数">
              <el-progress
                :percentage="readerInfo.creditScore"
                :color="getCreditScoreColor(readerInfo.creditScore)"
              />
            </el-descriptions-item>
            <el-descriptions-item label="借阅上限">
              {{ readerInfo.borrowLimit }} 本
            </el-descriptions-item>
            <el-descriptions-item label="当前借阅">
              {{ readerInfo.borrowedCount }} 本
            </el-descriptions-item>
            <el-descriptions-item label="待缴罚款">
              <span :class="{ 'fine-warning': readerInfo.totalFines > 0 }">
                ¥{{ readerInfo.totalFines.toFixed(2) }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="passwordFormRef"
        label-width="100px"
        style="max-width: 500px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleChangePassword">修改密码</el-button>
          <el-button @click="resetPasswordForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Database, TABLES } from '@/services/database'
import { useAuthStore } from '@/stores/auth'
import type { Reader } from '@/types/models'

const authStore = useAuthStore()
const readerInfo = ref<Reader | null>(null)
const passwordFormRef = ref<FormInstance>()

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

onMounted(() => {
  loadReaderInfo()
})

const loadReaderInfo = () => {
  if (!authStore.user) return
  
  const readers = Database.query<Reader>(
    TABLES.READERS,
    r => r.userId === authStore.user?.userId
  )
  
  if (readers.length > 0) {
    readerInfo.value = readers[0]
  }
}

const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const getCreditScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const handleChangePassword = async () => {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async valid => {
    if (!valid) return

    const result = await authStore.changePassword(
      passwordForm.oldPassword,
      passwordForm.newPassword
    )

    if (result.success) {
      ElMessage.success('密码修改成功')
      resetPasswordForm()
    } else {
      ElMessage.error(result.message)
    }
  })
}

const resetPasswordForm = () => {
  Object.assign(passwordForm, {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  passwordFormRef.value?.clearValidate()
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 32px;
  margin-bottom: 30px;
  color: #333;
}

.info-card {
  margin-bottom: 20px;
}

.card-header {
  font-weight: bold;
  font-size: 16px;
}

.fine-warning {
  color: #f56c6c;
  font-weight: bold;
}

.password-card {
  margin-top: 20px;
}
</style>
