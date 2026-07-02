<template>
    <div class="container">
        <div class="title">
            <div class="back-home" @click="backTohome">
                <el-icon><Back /></el-icon>
                <span>返回首页</span>
            </div>
            <div class="title-txet">
                <h2>登录您的账户</h2>
                <p>请输入您的登录信息</p>
            </div>
        </div>

        <div class="form-container">
            <el-form
            ref="ruleFormRef"
            :model="formData"
            :rules="rules"
            label-position="top"
            >
            <el-form-item prop="username" label="用户名或邮箱">
                <el-input v-model="formData.username" size="large" placeholder="请输入用户名"/>
            </el-form-item>

            <el-form-item prop="password" label="密码">
                <el-input v-model="formData.password" size="large" placeholder="请输入密码" type="password" show-password/>
            </el-form-item>
            <el-button class="btn" type="primary" size="large" @click="submitForm(ruleFormRef)">登录</el-button>
            </el-form>
            <div class="footer">
                <p>还没有账户？<router-link to="/auth/register">去注册</router-link></p>
            </div>

        </div>
    </div>
</template>

<script setup>
import {reactive, ref} from 'vue';
import { login } from '../api/admin';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
const formData = reactive({  //这里涉及到ref和reactive的使用区别
    username:'',
    password:''
})

const ruleFormRef = ref()

const rules = reactive({
    username:[
        {required:true, message:'请输入用户名', trigger:'blur'}
    ],
    password:[
        {required:true, message:'请输入密码', trigger:'blur'}
    ]
})
const router = useRouter()

const backTohome = ()=>{
    router.push('/')
}

//要把菜单实例作为参数（formEL）传给这个点击函数，才能在函数内部调用菜单实例的 validate 方法来验证表单数据
//验证数据 向后端发出请求
const submitForm = async (formEL)=>{
    if(!formEL) return;
    await formEL.validate((valid)=>{
        if(valid){
            console.log(formData)
            login(formData).then(res =>{
                if(!res.token){
                    return ElMessage.error(res.data.msg || '登录失败')
                }
                localStorage.setItem('token', res.token) //把token存储在本地
                localStorage.setItem('userInfo', JSON.stringify(res.userInfo)) //把用户信息存储在本地
                //根据用户角色决定跳转路径
                if(res.userInfo.userType === 2 ){
                    router.push('/back/dashboard')
                }else{
                    router.push('/')
                }
            })
        }
    })
}
</script>

<style lang="scss" scoped>
.container{
    width: 384px;
    .title{
        .back-home{
            margin-bottom: 60px;
        }
        .title-txet{
            text-align: center;
            h2{
                font-size: 36px;
                margin-bottom: 10px;
            }
            p{
                font-size: 18px;
                color: #6b7280;
            }
        }
    }
    .form-container{
        margin-top: 30px;
        .btn{
            width: 100%;
            margin-top: 40px;
        }
        .footer{
            padding:30px;
            text-align: center;
        }
    }
}
</style>