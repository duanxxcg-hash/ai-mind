<template>
    <div>
        <PageHead title="知识文章"> 
            <template #buttons>
                <el-button @click="handleEdit({})" type="primary">新增</el-button>
            </template>
        </PageHead>

        <TabelSearch :formItem = 'formItem' @search="handleSearch"/>

        <el-table :data="tableData" style="width:100%; margin-top: 25px;">
            <el-table-column label="文章标题" fixed="left" width="400">
                <template #default="scope">
                    <div style="display: flex; align-items: center;">
                        <el-icon><timer /></el-icon>
                        <span>{{ scope.row.title }}</span>
                    </div>
                </template>
            </el-table-column>

            <el-table-column label="分类" width="200">
                <template #default="scope">
                    <div style="display: flex; align-items: center;">
                        <el-icon><timer /></el-icon>
                        <span>{{ categoryMap[scope.row.categoryId] }}</span> 
                    </div>
                </template>
            </el-table-column>

            <el-table-column prop="authorName" label="作者" width="150" />
            <el-table-column prop="readCount" label="阅读量" width="150" />
            <el-table-column prop="updatedAt" label="发布时间" width="150" />

            <el-table-column fixed="right" label="操作" width="240">
                <template #default="scope"> 
                    <el-button @click="handleEdit(scope.row)" text type="primary" >编辑</el-button>
                    <el-button @click="handleUnpublish(scope.row)" v-if="scope.row.status === 1" text type="warning" >下线</el-button>
                    <el-button @click="handlePublish(scope.row)" v-if="scope.row.status === 0||scope.row.status === 2" text type="success" >发布</el-button>
                    <el-button @click="handleDelete(scope.row)" text type="danger" >删除</el-button>
                </template>
            </el-table-column>

        </el-table>

        <el-pagination
            style="margin-top: 25px;"
            :page-size="pagination.size"
            layout="prev,pager,next"
            :total="pagination.total"
            @change="handleChange" 
           />

           <ArticleDialog v-model:modelValue="dialogVisible" :categories="categories" :article="currentArticle" @success="handleSuccess"/>
    </div>
</template>
<script setup>
import { onMounted , ref ,reactive} from 'vue';
import PageHead from '../components/PageHead.vue';
import TabelSearch from '../components/TabelSearch.vue';
import { categoryTree , articlePage,getArticleDetail,changeArticleStatus,deleteArticle} from '../api/admin';
import ArticleDialog from '../components/ArticleDialog.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

//父组件中的数据来源，根据提供的表单数据，帮助子组件确认应该渲染出怎样的组件
const formItem = [
    {comp:'input', prop:'title', label:'文章标题', placeholder:'请输入文章标题'},
    {comp:'select', prop:'categoryId', label:'分类', placeholder:'请选择分类'},
    {comp:'select', prop:'status', label:'状态', placeholder:'选择状态',options:[
        {label:'草稿', value:'0'},
        {label:'已发布', value:'1'},
        {label:'已下线', value:'2'},
    ]}
]

const pagination = reactive({
    currentPage:1,
    size:10,
    total:0
})

//按条件查询
const handleSearch = async (formData) =>{
    console.log(formData)

    const params = { //从后端接口得知参数有分页参数和表单数据，所以这里把它们合并成一个对象
        ...pagination,
        ...formData
    };

    //records是后端返回的所有文章数据 total是一共多少条
    const {records,total} = await articlePage(params)

    tableData.value = records
    pagination.total = total
}

const handleChange = (page) =>{
    pagination.currentPage = page
    handleSearch() //页码改变时重新获取数据
}

const categoryMap = reactive({}) //用来存储分类数据的映射关系
const categories = ref([]) //用来存储分类数据的列表

const tableData = ref([])
const dialogVisible = ref(false)

//用来存储文章信息
const  currentArticle = ref(null)

//监听到子组件的success事件时，重新获取数据以刷新表格
const handleSuccess =()=>{
    dialogVisible.value=false
    handleSearch()
}

//处理编辑逻辑
const handleEdit = (row) =>{
    if(!row.id) {  //如果文章有id 就代表已经新建过 这里是!row.id判断新增
    //新增
    currentArticle.value = null
    dialogVisible.value = true
    }else{
        //编辑 从后端请求编辑的文章详情
        getArticleDetail(row.id).then(res =>{
        console.log(res,'编辑详情')
        currentArticle.value = res
        dialogVisible.value = true
    })
    }    
}

//发布
const handlePublish=(row)=>{
    ElMessageBox.confirm(
        `确认发布文章${row.title}吗？`,
        '确认',
        {
            confirmButtonText:'确认发布',
            cancelButtonText:'取消',
            type:'info'
        }
    ).then( ()=>{
        changeArticleStatus(row.id,{status:1}).then(res=>{
            ElMessage.success('发布成功')
            handleSearch()
        })
    })
}

//下线
const handleUnpublish= (row)=>{
    ElMessageBox.confirm(
        `确认下线文章${row.title}吗？`,
        '确认',
        {
            confirmButtonText:'确认下线',
            cancelButtonText:'取消',
            type:'warning'
        }
    ).then( ()=>{
        changeArticleStatus(row.id,{status:2}).then(res=>{
            ElMessage.success('下线成功')
            handleSearch()
        })
    })
}

//删除
const handleDelete=(row)=>{
    ElMessageBox.confirm(
        `确认删除文章${row.title}吗？`,
        '确认',
        {
            confirmButtonText:'确认删除',
            cancelButtonText:'取消',
            type:'danger'
        }
    ).then( ()=>{
        deleteArticle(row.id).then(res=>{
            ElMessage.success('删除成功')
            handleSearch()
        })
    })
}

//组件挂载时获取分类数据，并构建映射关系
onMounted( async ()=>{
    const data = await categoryTree()
    categories.value = data.map(item =>{
        categoryMap[item.id] = item.categoryName //构建id到名称的映射关系
        return {
            label:item.categoryName,
            value:item.id
        }
    })
    formItem[1].options = categories.value
}
)







handleSearch()

</script>
