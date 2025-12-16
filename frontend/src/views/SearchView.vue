<template>
  <div class="search-view">
    <el-card>
      <template #header>
        <h2>搜索出版物</h2>
      </template>

      <el-form :model="searchForm" :inline="true">
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable />
        </el-form-item>

        <el-form-item label="作者">
          <el-input v-model="searchForm.author" placeholder="请输入作者" clearable />
        </el-form-item>

        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="图书" value="book" />
            <el-option label="期刊" value="magazine" />
            <el-option label="电子书" value="ebook" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="results-card">
      <template #header>
        <div class="card-header">
          <span>搜索结果 ({{ publications.length }})</span>
        </div>
      </template>

      <el-empty v-if="publications.length === 0" description="暂无数据" />

      <el-table v-else :data="publications" stripe>
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column prop="author" label="作者" width="150" />
        <el-table-column prop="publisher" label="出版社" width="150" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.type === 'book'" type="success">图书</el-tag>
            <el-tag v-else-if="row.type === 'magazine'" type="warning">期刊</el-tag>
            <el-tag v-else type="info">电子书</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'available'" type="success">可借</el-tag>
            <el-tag v-else type="info">已借出</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="availableCopies" label="可借数量" width="100" />
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.averageRating" disabled show-score text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleBorrow(row)" :disabled="row.availableCopies === 0">
              借阅
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
import { PublicationService } from '@/services/publicationService'
import { BorrowService } from '@/services/borrowService'
import { UserService } from '@/services/userService'
import { useAuthStore } from '@/stores/auth'
import type { Publication } from '@/types/models'

const authStore = useAuthStore()

const searchForm = ref({
  title: '',
  author: '',
  type: ''
})

const publications = ref<Publication[]>([])

const handleSearch = () => {
  publications.value = PublicationService.searchPublications({
    title: searchForm.value.title || undefined,
    author: searchForm.value.author || undefined,
    type: searchForm.value.type as any || undefined
  })
}

const handleReset = () => {
  searchForm.value = {
    title: '',
    author: '',
    type: ''
  }
  loadPublications()
}

const handleBorrow = (publication: Publication) => {
  if (!authStore.user) {
    ElMessage.error('请先登录')
    return
  }

  const reader = UserService.getReaderByUserId(authStore.user.userId)
  if (!reader) {
    ElMessage.error('读者信息不存在')
    return
  }

  const result = BorrowService.createBorrowRecord(reader.readerId, publication.publicationId)
  if (result.success) {
    ElMessage.success('借阅成功')
    handleSearch()
  } else {
    ElMessage.error(result.message)
  }
}

const loadPublications = () => {
  publications.value = PublicationService.getAllPublications()
}

onMounted(() => {
  loadPublications()
})
</script>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.results-card {
  margin-top: 20px;
}

.card-header {
  font-weight: bold;
}
</style>
