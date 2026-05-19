<template>
    <el-dialog
        :title="isEdit ? '编辑文章' : '新增文章'"
        v-model="dialogVisible"   
        width="50%"
        @close="handleClose" 
    >
        <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
            <el-form-item label="文章标题" prop="title">
                <el-input v-model="formData.title" placeholder="请输入文章标题" maxlength="200" show-word-limit clearable/>
            </el-form-item>
             
            <el-form-item label="所属分类" prop="categoryId">
                <el-select v-model="formData.categoryId" placeholder="请选择分类" >
                    <el-option
                        v-for="item in categories"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>

            <el-form-item label="文章内容" prop="summary">
                <el-input v-model="formData.summary" type="textarea" maxlength="1000" placeholder="请输入文章内容（可选）" :rows="4" show-word-limit />
            </el-form-item>

            <el-form-item label="标签" prop="tags">
                <el-select v-model="formData.tagArray" placeholder="请输入文章标签（逗号分隔）" multiple filterable  allow-create style="width: 100%">
                    <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
                </el-select>
            </el-form-item>

            <el-form-item label="封面图片">
                <div class="cover-upload">
                    <el-upload
                        class="avatar-uploader"
                        action="#" 
                        :before-upload="beforeUpload"
                        :http-request="handleUploadRequest"
                        :show-file-list="false"
                        accept="image/*"
                    >
                        <div v-if="!imgUrl" class="cover-placeholder">
                            <p>点击上传封面</p>
                            
                        </div>
                        <img v-else :src="imgUrl"  class="cover-image" alt="封面图片" />

                    </el-upload>
                    <div v-if="imgUrl" class="cover-remove" >
                        <el-button type="danger" size="mini" @click="handleRemove">移除封面</el-button> 
                    </div>
                </div>

            </el-form-item>
            <el-form-item label="文章内容" prop="content">
                <RichTextEditor 
                v-model="formData.content"
                palcecholder="请输入文章内容,支持富文本格式\n\n可以使用加粗、斜线、列表标题等来丰富文章内容"
                :maxCharCount="5000"
                @change="handleContentChange"
                @created="handleEditorCreated"
                min-height="400px"
                />

            </el-form-item>
        </el-form>
        <div v-if="btnPreview">
            <h3>内容预览</h3>
            <div v-html="formData.content"></div>
        </div>
        <template #footer>
            <el-button @click="btnPreview = !btnPreview">{{btnPreview? '隐藏预览':'预览效果'}}</el-button>
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleSubmit()" :loading="loading">{{ isEdit ? '更新文章' : '创建文章' }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref,computed,reactive,nextTick,watch } from 'vue';
import { ElMessage } from 'element-plus';
import { articlePage, categoryTree,createArticle,updateArticle } from '../api/admin';
import {uploadFile} from '../api/admin';
import { fileBaseUrl } from '../config';
import RichTextEditor from './RichTextEditor.vue';

const props =  defineProps({
    modelValue:{  //桥梁 dialogVisible
        type:Boolean,
        default:false
    },
    categories:{
        type:Array,
        default:()=>[]
    },
    article:{
        type:Object,
        default:null //
    }
})

//定义事件 用于向父组件传递数据或者通知父组件某些事情发生了

const emit = defineEmits(['update:modelValue', 'success']) 

const isEdit = computed(() => !!props.article?.id) //根据是否有article对象来判断是编辑还是创建

//监听编辑数据 实现点击编辑后文章现有数据的回显
watch(()=>props.article,(newVal)=>{  //watch函数的第一个参数是监听对象，第二个参数是进行的操作
    if(newVal){
        nextTick(()=>{// 等待下一次DOM渲染结束再进行以下操作
            Object.assign(formData,newVal)
            businessId.value=newVal.id
            imgUrl.value = fileBaseUrl+newVal.coverImage
        })
        
    }
})

//computed监听modelValue的变化，父组件传入的值dialogVisible改变时，子组件中dialogVisible也会随之改变
const dialogVisible = computed({ 
    get(){
        return props.modelValue    //父组件传入的值 父组件中定义桥梁 :modelValue="dialogVisible"
    },
        set(val){
        //告诉父组件modelValue要被修改了
        emit('update:modelValue',val)
    }
})

const handleClose = () =>{
    //重置表单
    formRef.value.resetFields() //这里是指恢复到DOM渲染的初始状态
    businessId.value=null
    //重置标签
    formData.tagArray=[]
    //重置封面图片及数据
    handleRemove()
    emit('update:modelValue',false)
}

//表单数据

const formData = reactive({
    "title": "",
    "content": "",
    "coverImage": "",
    "categoryId": 1,
    "summary": "",
    "tags": "",
    "id": "",
})


const rules = reactive({
    title:[
        {required:true, message:'请输入文章标题', trigger:'blur'},
        {max:200, message:'文章标题最多200个字符', trigger:'blur'}
    ],
    categoryId:[
        {required:true, message:'请选择分类', trigger:'change'}
    ],
    content:[
        {required:true, message:'请输入文章内容', trigger:'blur'},
        {max:5000, message:'文章内容最多5000个字符', trigger:'blur'}
    ]
})

const commonTags = [
  '情绪管理', '焦虑', '抑郁', '压力', '睡眠', 
  '冥想', '正念', '放松', '心理健康', '自我成长',
  '人际关系', '工作压力', '学习方法', '生活技巧'
]

//上传
const imgUrl = ref('') 

const beforeUpload = (file) =>{
    //针对上传的文件进行校验
    const isImage = file.type.startsWith('image/')
    const isLt5M = file.size / 1024 / 1024 < 5
    if(!isImage){
        ElMessage.error('上传封面图片，请选择图片文件')
        return false
    }
    if(!isLt5M){
        ElMessage.error('上传的图片大小不能超过5MB')
        return false
    }

    return true
}

const businessId = ref(null)  //上传文件的唯一标识

const handleUploadRequest = async ({file})=>{
    //UUID生成唯一文件名
    businessId.value = crypto.randomUUID()
// uploadFile是定义的Post请求
    const fileRes = await uploadFile(file,{
        businessId:businessId.value,
    })
    console.log(fileRes)  
    //拼接完整的图片URL地址
    imgUrl.value = fileBaseUrl+fileRes.filePath
    //这里直接把后端返回的文件路径保存到表单数据中，展示时再拼接URL
    formData.coverImage = fileRes.filePath
}

//移除封面的逻辑
const handleRemove = () =>{
    imgUrl.value = ''
    formData.coverImage = ''
}


//富文本 绑在富文本标签上的
const handleContentChange = (data) =>{
    console.log(data,'富文本内容')
    formData.content = data.html
    //data是富文本标签的数据
}

//定义了一个编辑器实例
const editorInstance = ref(null)

//创建编辑器
const handleEditorCreated = (editor) =>{
    console.log(editor,'编辑器实例')
    //把编辑器实例存到外面的变量里 这样页面其他地方也能调用编辑器（比如提交、清空、获取内容）
    editorInstance.value=editor
    //编辑 输入框回显文本效果
    if(formData.content && editor){
        //nextTick 会等：Vue 渲染完成 → DOM 就绪 → 再把表单里的富文本内容自动回填到编辑器中。
        nextTick(()=>{
            editor.setHtml(formData.content)
        })
    }
}

//控制是否能预览效果（点击了预览就变true）
const btnPreview = ref(false)

const loading = ref(false)
const formRef=ref()

//处理创建/新增文章 向后端提交数据
const handleSubmit = () =>{
    formRef.value.validate((valid,fields)=>{
        if(valid){
            loading.value = true
        }
        console.log(formData,'提交表单数据')
        //定义一个submitData对象，把要提交的数据准备好
        const submitData = {
            ...formData,//解构
            tags:formData.tagArray.join(',')
        }
        delete submitData.tagArray

        //通过isEdit判断是新增还是编辑
        if(!isEdit.value){  //新增处理
            submitData.id=businessId.value 
            createArticle(submitData).then(res=>{
            loading.value=false
            emit('success') //通知父组件文章创建成功
        })
        }else{//编辑 调用编辑的接口
            updateArticle(props.article.id,submitData).then(res=>{
                loading.value=false
                emit('success')
            })
        }   
    })
}
</script>

<style lang="scss" scoped>
.cover-placeholder {
    width: 200px;
    height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #8b949e;
    background: #f6f8fa;

}

.cover-image {
    width: 200px;
    height: 120px;
    display: block;
}

</style>