import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create(
    {
        baseURL: '/api', //请求的前缀
        timeout: 5000, //超时时间
    }
)

//这里创建请求拦截器 自动加上token
request.interceptors.request.use(
    //config内包含了本次请求的全部数据
    config => {
        const token = localStorage.getItem('token') //从本地获取token
        if (token) { config.headers['token'] = token }
        return config
    },
    err => {
        return Promise.reject(err)
    }
)

//响应拦截器 成功就返回响应的数据  否则返回报错信息
request.interceptors.response.use(
    res => {
        const { data, config } = res  //这里data实际上就是res.data 
        //处理业务状态码
        if (data.code === '200') {
            return data.data  //后端返回的数据
        }

        else {
            //登录过期（只有本身有token时收到-1才说明是过期，没token时是普通业务错误）
            if (data.code === '-1') {
                const token = localStorage.getItem('token')
                if (token && !config.url?.includes('/login')) {
                    ElMessage.error(data.msg || '登录过期，请重新登录')
                    localStorage.removeItem('token')
                    localStorage.removeItem('userInfo')
                    window.location.href = '/auth/login'
                } else {
                    return res
                }
            }
            return res;
        }
    },
    //这里是网络请求失败的处理
    err => {
        return Promise.reject(err)
    }
)

export default request