<template>
  <div class="publication-manage">
    <div class="page-header">
      <h2>出版物管理</h2>
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加出版物
      </el-button>
    </div>

    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="searchForm.author" placeholder="请输入作者" clearable />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
            <el-option label="全部" value="" />
            <el-option label="书籍" value="book" />
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

    <!-- 出版物列表 -->
    <el-card class="table-card">
      <el-table :data="filteredPublications" stripe style="width: 100%">
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="publisher" label="出版社" width="150" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeColor(row.type)">
              {{ getTypeName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalCopies" label="总数量" width="80" />
        <el-table-column prop="availableCopies" label="可借数量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'available' ? 'success' : 'info'">
              {{ row.status === 'available' ? '可借' : '不可借' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingId ? '编辑出版物' : '添加出版物'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择类型">
            <el-option label="书籍" value="book" />
            <el-option label="期刊" value="magazine" />
            <el-option label="电子书" value="ebook" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="作者" prop="author">
          <el-input v-model="form.author" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="出版社" prop="publisher">
          <el-input v-model="form.publisher" placeholder="请输入出版社" />
        </el-form-item>
        <el-form-item label="出版日期" prop="publishDate">
          <el-date-picker
            v-model="form.publishDate"
            type="date"
            placeholder="选择日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="form.location" placeholder="请输入位置，如：A区-1架-3层" />
        </el-form-item>
        <el-form-item label="总数量" prop="totalCopies">
          <el-input-number v-model="form.totalCopies" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="可借数量" prop="availableCopies">
          <el-input-number v-model="form.availableCopies" :min="0" :max="form.totalCopies" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { Database, TABLES } from '@/services/database'
import { CryptoUtils } from '@/utils/crypto'
import type { Publication } from '@/types/models'
import type { FormInstance, FormRules } from 'element-plus'

const showAddDialog = ref(false)
const editingId = ref('')
const formRef = ref<FormInstance>()
const publications = ref<Publication[]>([])

const searchForm = reactive({
  title: '',
  author: '',
  type: ''
})

const form = reactive({
  type: 'book' as 'book' | 'magazine' | 'ebook',
  title: '',
  author: '',
  publisher: '',
  publishDate: '',
  location: '',
  totalCopies: 1,
  availableCopies: 1
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  author: [{ required: true, message: '请输入作者', trigger: 'blur' }],
  publisher: [{ required: true, message: '请输入出版社', trigger: 'blur' }],
  totalCopies: [{ required: true, message: '请输入总数量', trigger: 'blur' }]
}

const filteredPublications = computed(() => {
  let result = publications.value
  if (searchForm.title) {
    result = result.filter(p => p.title.includes(searchForm.title))
  }
  if (searchForm.author) {
    result = result.filter(p => p.author.includes(searchForm.author))
  }
  if (searchForm.type) {
    result = result.filter(p => p.type === searchForm.type)
  }
  return result
})

onMounted(() => {
  loadPublications()
})

const loadPublications = () => {
  publications.value = Database.getAll<Publication>(TABLES.PUBLICATIONS)
}

const getTypeName = (type: string) => {
  const names: Record<string, string> = {
    book: '书籍',
    magazine: '期刊',
    ebook: '电子书'
  }
  return names[type] || type
}

const getTypeColor = (type: string) => {
  const colors: Record<string, any> = {
    book: 'primary',
    magazine: 'success',
    ebook: 'warning'
  }
  return colors[type] || ''
}

const handleSearch = () => {
  // 搜索已通过 computed 实现
}

const handleReset = () => {
  searchForm.title = ''
  searchForm.author = ''
  searchForm.type = ''
}

const handleEdit = (row: Publication) => {
  editingId.value = row.publicationId
  form.type = row.type
  form.title = row.title
  form.author = row.author
  form.publisher = row.publisher
  form.publishDate = row.publishDate
  form.location = row.location
  form.totalCopies = row.totalCopies
  form.availableCopies = row.availableCopies
  showAddDialog.value = true
}

const handleDelete = async (row: Publication) => {
  try {
    await ElMessageBox.confirm('确定要删除这个出版物吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    Database.delete(TABLES.PUBLICATIONS, 'publicationId', row.publicationId)
    ElMessage.success('删除成功')
    loadPublications()
  } catch {
    // 用户取消
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async valid => {
    if (!valid) return
    
    const borrowPeriod = form.type === 'book' ? 30 : form.type === 'magazine' ? 7 : 0
    
    if (editingId.value) {
      // 编辑
      Database.update<Publication>(TABLES.PUBLICATIONS, 'publicationId', editingId.value, {
        type: form.type,
        title: form.title,
        author: form.author,
        publisher: form.publisher,
        publishDate: form.publishDate,
        location: form.location,
        totalCopies: form.totalCopies,
        availableCopies: form.availableCopies,
        borrowPeriod
      })
      ElMessage.success('编辑成功')
    } else {
      // 添加
      const publication: Publication = {
        publicationId: CryptoUtils.generateId('pub'),
        type: form.type,
        title: form.title,
        author: form.author,
        publisher: form.publisher,
        publishDate: form.publishDate,
        status: form.availableCopies > 0 ? 'available' : 'unavailable',
        borrowPeriod,
        location: form.location,
        totalCopies: form.totalCopies,
        availableCopies: form.availableCopies,
        averageRating: 0,
        totalRatings: 0,
        categoryId: ''
      }
      Database.insert(TABLES.PUBLICATIONS, publication)
      ElMessage.success('添加成功')
    }
    
    showAddDialog.value = false
    editingId.value = ''
    resetForm()
    loadPublications()
  })
}

const resetForm = () => {
  form.type = 'book'
  form.title = ''
  form.author = ''
  form.publisher = ''
  form.publishDate = ''
  form.location = ''
  form.totalCopies = 1
  form.availableCopies = 1
}
</script>

<style scoped>
.publication-manage {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  border-radius: 8px;
}
</style>
