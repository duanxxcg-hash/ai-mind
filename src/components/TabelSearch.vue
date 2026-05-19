<template>
    <el-form ref="ruleFormRef" :model="formData">
        <el-row :gutter="24">
            <template v-for="item in formItemAttr" :key="item.prop">
            <el-col v-bind="item.col">
                <el-form-item :label="item.label" :prop="item.prop">
                <component v-model="formData[item.prop]" :is="isComp(item.comp)" :placeholder="item.placeholder">
                    <template v-if="item.comp === 'select'" >
                    <el-option label="全部" value="" />
                    <el-option
                    v-for="opt in item.options"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                    />
                </template>
                </component>

            </el-form-item>
            </el-col>
        </template>
        </el-row>
        
        <el-row>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button  @click="handleReset(ruleFormRef)">重置</el-button>
        </el-row>
    </el-form>
</template>

<script setup>
import { ref,reactive, computed } from 'vue';

//需要接收的父组件的值
const props = defineProps({formItem:{
        type: Array,
        default:()=>[]
    }}
)

const ruleFormRef = ref()

//在父组件中需要监听的事件 子组件触发
const emit = defineEmits(['search'],['reset'])

const formItemAttr = computed(() =>{
    const {formItem} = props //这里是指针，所以在这里修改formItem的值，父组件中的formItem也会被修改
    formItem.forEach(item =>{ 
        item.col = { xs:24, sm:12, md:8, lg:6 , xl:6 }
    })
    return formItem;
})

//表单数据
let formData = reactive({});
const isComp = (comp)=>{
    return {
        input:'el-input',
        select:'el-select'
    }[comp]   //可以把返回的对象看作一个map 所以map[key] = value
}

const handleSearch = ()=>{
    emit('search',formData)
}

const handleReset = (ruleFormRef)=>{ //拿到这个表单
    if(!ruleFormRef) return;
    ruleFormRef.resetFields(); //调用表单的重置方法
    emit('search',formData)
}
</script>