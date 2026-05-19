import { pa } from "element-plus/es/locale/index.mjs";
import request from "../utils/request";

export function login(data) {
    return request.post('/user/login', data) //POST请求 传递数据
}

export function logout() {
    return request.post('/user/logout')
}

export function categoryTree() {
    return request.get('/knowledge/category/tree')
}

export function articlePage(params) {
    return request.get('/knowledge/article/page', { params })  //{params:params} 这种写法会把params对象中的属性作为查询参数拼接到URL后面
}

export function uploadFile(file, businessInfo) {
    const formData = new FormData()  //new 构造函数,这里新建一个formData对象，容器用于存储要上传的文件和相关信息
    formData.append('file', file) //将文件添加到FormData对象中，key为'file'
    formData.append('businessType', 'ARTICLE')
    formData.append('businessId', businessInfo.businessId)
    formData.append('businessField', 'cover')
    return request.post('/file/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data' //告诉服务器这是一个文件上传请求
        }
    })
}

export function createArticle(data) {
    return request.post('/knowledge/article', data)
}

export function getArticleDetail(id) {
    return request.get(`/knowledge/article/${id}`)
}

export function updateArticle(id, data) {
    return request.put(`/knowledge/article/${id}`, data)
}

export function changeArticleStatus(id, data) {
    return request.put(`/knowledge/article/${id}/status`, data)
}

export function deleteArticle(id) {
    return request.delete(`/knowledge/article/${id}`)
}

export function getConsulationPage(params) {
    return request.get('/psychological-chat/sessions', { params })
}

export function getSessionDetail(sessionId) {
    return request.get(`/psychological-chat/sessions/${sessionId}/messages`)
}

export function getEmotionalPage(params) {
    return request.get('/emotion-diary/admin/page', { params })
}

export function deleteEmotional(id) {
    return request.delete(`/emotion-diary/admin/${id}`)
}

export function getAnalyticsOverview() {
    return request.get('/data-analytics/overview')
}
