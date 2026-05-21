<template>
    <div class="consultation-container">
        <div class="sidebar">
            <!-- AI助手信息 -->
             <div class="ai-assistant-info">
                <div class="breathing-circle">
                    <el-image :src="iconUrl" style="width: 25px; height: 25px;" alt="AI助手" />
                </div>
                <h3 class="assistant-name">宁渡AI助手</h3>
                <div class="online-status">
                    <div class="status-dot"></div>
                    在线服务中
                </div>
             </div>
             <!-- 情绪花园 -->
              <div class="emotion-garden">
                <div class="garden-header">
                    <div class="garden-title">情绪花园</div>
                </div>
                <div class="emotion-info">
                    <div class="emotion-name">中性</div>
                    <div class="emotion-score">50</div>
                </div>
                <div class="warm-tips">
                    <div class="emotion-status-text">
                        <span class="status-label">今天感觉</span>
                        <span class="status-emotion">{{ currentEmotion.isNegative ? '需要关注' : '很不错' }}</span>
                    </div>
                    <div class="emotion-intensity">
                        <span class="intensity-dots">
                            <span v-for="dot in 3" :key="dot" class="dot" :class="{'active': getIntensityClass(currentEmotion.emotionScore) >= dot}"></span>
                        </span>
                        <span class="intensity-text">
                            {{ getRiskText(currentEmotion.riskLevel) }}
                        </span>
                    </div>
                    <!-- 温暖建议卡片 -->
                     <div class="warm-suggestion" v-if="currentEmotion.suggestion">
                        <div class="suggestion-icon">💝</div>
                        <div class="suggestion-content">
                            <div class="suggestion-title">给你的小建议</div>
                            <div class="suggestion-text">{{ currentEmotion.suggestion }}</div>
                        </div>
                    </div>
                    <!-- 治愈行动清单 -->
                     <div class="healing-actions" v-if="currentEmotion.improvementSuggestions.length > 0 ">
                        <div class="actions-title">治愈小行动</div>
                        <div class="actions-list">
                            <div class="action-item" v-for="action in currentEmotion.improvementSuggestions" :key="action">
                                <div class="action-icon">✨</div>
                                <div class="action-text">{{ action }}</div>
                            </div>
                        </div>
                     </div>
                     <!-- 风险提示 -->
                      <div class="risk-notice" v-if="currentEmotion.riskLevel > 1 && currentEmotion.isNegative">
                        <div class="notice-icon">🤗</div>
                        <div class="notice-content">
                            <div class="notice-title">温馨提示</div>
                            <div class="notice-text">{{ currentEmotion.riskDescription }}</div>
                        </div>
                      </div>
              </div>
            </div>
             <!-- 会话列表 -->
             <div class="session-history">
                <h4 class="section-title">会话列表</h4>
                <div class="session-list">
                    <div v-for="session in sessionList" :key="session.id" @click="handleSessionClick(session)" class="session-item">
                        <div class="session-info">
                            <div class="session-title">
                                <span>{{ session.sessionTitle }}</span>
                                <div class="session-meta">
                                    <span class="session-time">{{ session.startedAt }}</span>
                                </div>
                                <div class="session-preview">
                                    {{ session.lastMessageContent }}
                                </div>
                                <div class="session-stats">
                                    <span>
                                        <el-icon>
                                            <ChatRound />
                                        </el-icon>
                                        {{ session.messageCount || 0}}
                                    </span>
                                </div>
                            </div>
                            <div class="session-actions">
                                <el-button text type="danger" size="small" @click="handleDeleteSession(session.id)">
                                    <el-icon>
                                        <DeleteFilled />
                                    </el-icon>
                                </el-button>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        <div class="chat-main">
            <div class="chat-header">
                <div class="header-left">
                    <div class="chat-avatar">
                        <el-image :src="iconUrl1" style="width: 30px;height: 30px;" />
                    </div>
                    <div class="chat-info">
                        <h2>宁渡AI助手</h2>
                        <p>您贴心的AI心理健康助手</p>
                    </div>
                </div>
                <el-button circle @click="createNewFrontendSession" title="新建会话">
                    <el-icon>
                        <Plus />
                    </el-icon>
                </el-button>
            </div>
            <!-- AI聊天区域 -->
            <div class="chat-messages" ref="chatMessagesRef">
                <!-- 欢迎用语 （当历史对话记录长度为0时 显示的是欢迎语）-->
                <div v-if="messages.length === 0" class="messages-item ai-messages">
                    <div class="messages-avatar">
                       <el-image :src="iconUrl" style="width: 18px; height: 18px;" />
                    </div>
                    <div class="messages-content">
                        <div class="messages-bubble">
                            <p>您好！我是小暖，您的AI心理健康助手。很高兴陪伴您，为您提供温暖的心理支持。请告诉我，今天您感觉怎么样？有什么想要分享的吗？</p>
                        </div>
                        <div class="messages-time">刚刚</div>
                    </div>
                </div>

                <!-- 消息列表 -->
                <div v-for="msg in messages" :key="msg.id" class="messages-item" :class="msg.senderType === 1 ? 'user-messages' : 'ai-messages'">
                    <div class="messages-avatar">
                        <el-image v-if="msg.senderType === 1" :src="iconUrl2" style="width: 18px; height: 18px;"></el-image>
                        <el-image v-if="msg.senderType === 2" :src="iconUrl" style="width: 18px; height: 18px;"></el-image>
                    </div>
                    <div class="messages-content">
                        <div class="messages-bubble">
                            <!-- AI正在思考中 -->
                            <div class="typing-indicator" v-if="msg.senderType === 2 && isAiTyping && !msg.content">
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                                <div class="typing-dot"></div>
                            </div>
                            <!-- AI错误提示 -->
                            <div v-else-if="msg.isError" class="error-messages">
                                <p>{{ msg.content }}</p>
                            </div>
                            <!-- AI正常返回消息 -->
                            <MarkdownRenderer v-else-if="msg.senderType === 2 && !msg.isError" :content="msg.content" :is-ai-messages="true"></MarkdownRenderer>
                            <!-- 用户数据 -->
                             <p v-else-if="msg.content" v-html="formatMessageContent(msg.content)"></p>
                        </div>
                        <div class="messages-time">{{ msg.senderType === 2 && isAiTyping ? '正在输入中...' : msg.createdAt}}</div>
                    </div>
                </div>
            </div>


            <!-- 消息输入区 -->
            <div class="chat-input">
                <div class="input-container">
                    <el-input 
                        v-model="userMessage"
                        placeholder="请输入您想要分享的内容..."
                        type="textarea"
                        :rows="3"
                        :disabled="isAiTyping"
                        @keydown="handleKeyDown"
                        class="messages-input"
                        clearable
                    />
                    <div class="input-footer">
                        <span>按Enter发送，Shift+Enter换行</span>
                        <span>{{ userMessage.length }}/500</span>
                    </div>
                </div>
                <el-button :disabled="!userMessage.trim() || userMessage.length>500" class="send-btn" @click="sendMessage" type="primary">
                    <el-icon>
                        <Promotion/>
                    </el-icon>
                </el-button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { Promotion } from '@element-plus/icons-vue';
import { ref, reactive, onMounted, nextTick } from 'vue';
import { startSession ,getSessionList ,deleteSession,getSessionDetail,getSessionEmotion} from '../api/frontend';
import { ElMessage } from 'element-plus';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import {fetchEventSource} from '@microsoft/fetch-event-source'

const chatMessagesRef = ref(null) //这个ref是用来获取聊天消息区域的DOM元素的 以便在AI回复时自动滚动到底部显示最新消息

const scrollToBottom = () => {
    nextTick(() => { 
        if (chatMessagesRef.value) {
            chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight //将它的“滚动高度(scrollTop)”设置为它的“内容总高度(scrollHeight)”
        }
    })
}

const iconUrl = new URL('@/assets/images/robot-fill.png',import.meta.url).href
const iconUrl1 = new URL('@/assets/images/like.png',import.meta.url).href
const iconUrl2 = new URL('@/assets/images/users.png',import.meta.url).href


//点击加号 新增会话对象
const createNewFrontendSession = ()=>{
    messages.value=[]  //清空消息列表
    //清空情绪花园数据
    currentEmotion.value = {
        primaryEmotion:'中性',
        emotionScore:50,
        isNegative: false,
        riskLevel:0,
        suggestion:'情绪状态平稳',
        improvementSuggestions:[],
        riskDescription:'',
        riskLevel:0
    }
    //第一步：创建一个新的会话对象 其中的值都是默认值
    const newSession = {
        sessionId : `temp_${Date.now()}`, //Date.now()是JS自带的时间戳工具 返回当前时间
        status:'TEMP', //会话状态 此为默认值
        sessionTitle:'新会话'
    }
    //当前会话
    currentSession.value = newSession
    console.log(currentSession.value,'当前对话初始化')
}

//定义一个当前的会话对象（用来区分会话）
const currentSession = ref(null)
//历史对话列表
const sessionList = ref([]) 

//定义对话消息
const messages = ref([])

//接收用户输入信息 输入框内容(存储的是表单数据)
const userMessage = ref('')
//判断AI是否正在输出内容
const isAiTyping = ref(false)

//情绪花园 
const currentEmotion = ref({
    primaryEmotion:'中性',
    emotionScore:50,
    isNegative: false,
    riskLevel:0,
    suggestion:'情绪状态平稳',
    improvementSuggestions:[],
    riskDescription:'',
    riskLevel:0
})

//加载当前会话的情绪分析结果（每次点击会话列表中的会话时 都会调用这个函数 更新当前会话的情绪分析结果）
const loadSessionEmotion = (sessionId)=>{

    const id = sessionId.toString().startsWith('session_') ? sessionId : `session_${sessionId} `

    getSessionEmotion(id).then(res =>{
        currentEmotion.value = {
            primaryEmotion: '中性',
            emotionScore: 50,
            isNegative: false,
            riskLevel: 0,
            suggestion: '',
            improvementSuggestions: [],
            riskDescription: '',
            ...res
        }
    })
}

const getIntensityClass = (score)=>{
    if(score >= 61) return 3
    if(score >= 31) return 2
    return 1
}

const getRiskText = (level)=>{
    switch(level){
        case 0:
            return '正常'
        case 1:
            return '关注'
        case 2:
            return '预警'
        case 3:
            return '危机'
        default:
            return '正常'
    }
}

//按键回车发送
const handleKeyDown = (e)=>{
    if(e.key === 'Enter' && !e.shiftKey){
        e.preventDefault() // 阻止浏览器默认的回车换行行为
        sendMessage()      // 调用发送函数
    }
}

//用户发送信息：用户输入信息且点击发送后才会与后端联系创建会话实例
/*1. 检查信息合法且有内容  2.判断能否发送 3.调用接口传给后端*/
const sendMessage = ()=>{
    //userMessage是输入框的输入内容
    if(!userMessage.value.trim()) return //去掉输入信息的空格后还是空的话返回
    console.log(userMessage.value,'用户输入信息')
    if(isAiTyping.value){
        ElMessage.error('AI助手正在输入中，请稍后')
        return 
    }
    
    //此变量存储用户输入信息（与表单数据分割）
    const userMsg = userMessage.value.trim() //局部变量

    messages.value.push({
        id: Date.now(),
        senderType:1,
        content:userMsg,
        createdAt:new Date().toISOString(),
    })
    userMessage.value = ''
    scrollToBottom()

    //如果当前对话的会话是TEMP状态 那肯定不行了 需要创建新会话存储此次对话
    if(currentSession.value.status === 'TEMP'){
        startNewSession(userMsg)
    }else{
        //如果当前会话不是TEMP状态 说明已经有会话实例了 直接开始流式对话就行了
        startAIResponse(currentSession.value.sessionId , userMsg)
    }

}

//创建新的会话对象实例(赋值的过程 需要和后端有数据联系)
const startNewSession = (userMsg)=>{
    //构建会话参数 传给后端
    const sessionParams = {  //这里面的两个变量是后端接口创建会话所需要的  （消息以及标题）
        initialMessage: userMsg
    }

    sessionParams.sessionTitle = `宁渡AI助手 - ${new Date().toLocaleString()}`

    //调用后端接口拿到会话实例
    startSession(sessionParams).then( res =>{
        //将后端返回的会话数据转为前端定义的格式
        const sessionData = {
            sessionId: res.sessionId,
            status:res.status,
            sessionTitle : sessionParams.sessionTitle
        }
        //如果当前是临时会话 需要更新会话数据
        if(currentSession.value && currentSession.value.status === 'TEMP'){
            Object.assign(currentSession.value,sessionData)
        }else{
            //如果会话对象不存在 直接赋值
            currentSession.value = sessionData
        }

        //更新会话列表
        getSessionPage()

        //开始流式对话
        startAIResponse(currentSession.value.sessionId , userMsg)
    })
}


const startAIResponse = (sessionId, userMsg) => {
    if(isAiTyping.value){
        ElMessage.error('AI助手正在输入中，请稍后')
        return
    }
    isAiTyping.value = true
    let streamCompleted = false

    const aiMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
        senderType: 2,
        content: '',
        createdAt: new Date().toISOString(),
    }
    messages.value.push(aiMessage)
    const currentBubble = messages.value[messages.value.length - 1]

    const ctrl = new AbortController() //遥控器 用来控制流式请求的中止（当AI回复完成时 就可以调用它来中止请求 以节省资源）

    fetchEventSource('/api/psychological-chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', //告诉后端发过去的请求体是什么格式 让它知道如何解析
            'Token': localStorage.getItem('token'),
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ sessionId, userMessage: userMsg }),
         openWhenHidden: true,
        signal: ctrl.signal, //绑定遥控器信号 用来控制ctrl.abort()

        onopen: (response) => {
            if(response.headers.get('Content-Type') !== 'text/event-stream'){
                ElMessage.error('服务器返回非流式数据')
            }
        },

        onmessage: (event) => {
            if(streamCompleted) return  // done 之后的所有事件一律忽略
            const raw = event.data.trim()
            if(!raw) return
            const eventName = event.event

            if(eventName === 'done'){
                streamCompleted = true
                isAiTyping.value = false
                ctrl.abort()
                loadSessionEmotion(sessionId)
                getSessionPage()
                return
            }

            const payload = JSON.parse(raw)
            const ok = String(payload.code) === '200'

            if(ok && payload.data && payload.data.content){
                currentBubble.content += payload.data.content
                scrollToBottom()
            } else if(!ok){
                handleError(payload.messages || 'AI回复失败')
            }
        },

        onerror: (err) => {
            if(!streamCompleted) handleError('AI回复失败')
            throw err  // 阻止重连
        },

        onclose: () => {
            if(!streamCompleted) loadSessionEmotion(sessionId)
            throw new Error('stream closed')  // 阻止重连
        }
    })
}


//ai回复错误
const handleError = (err)=>{
    const aiMessage = messages.value[messages.value.length-1]
    if(aiMessage && aiMessage.senderType === 2){
        aiMessage.content = 'AI回复失败，请重试 '
    }
     isAiTyping.value = false
     ElMessage.error('AI回复失败，请重试')
}

//从后端获取历史对话数据，用以左边列表的呈现
const getSessionPage = ()=>{
    //调用接口 传递的是分页参数
    getSessionList({
        pageNum:1,
        pageSize:10
    }).then(res =>{
        //在这里把会话列表的对象数组接收
        sessionList.value = res.records
        console.log(sessionList.value,'历史会话记录')
    })
}


//点击列表中会话 更新当前会话内容
const handleSessionClick = (session)=>{
    getSessionDetail(session.id).then(res=>{
        messages.value = res
        scrollToBottom()
    })

    //需要更新当前会话对象的数据
    const sessionData = {
        sessionId:"session_"+session.id,
        status:'ACTIVE',
        sessionTitle:session.sessionTitle
    }
    currentSession.value = sessionData 
    loadSessionEmotion(currentSession.value.sessionId) //获取此会话的情绪分析结果 呈现在页面上
}

const handleDeleteSession = (sessionId)=>{
    deleteSession(sessionId).then(res=>{
        ElMessage.success('删除成功')
        getSessionPage()
    })
}

const formatMessageContent = (content)=>{
    return content.replace(/\n/g,'<br>')
}

onMounted(()=>{
    //初始化获取会话列表
    getSessionPage()

    //创建一个新的会话对象 初始化currentSession
    createNewFrontendSession()

})

</script>

<style lang="scss" scoped>
.consultation-container {
    margin: 0 auto;
    width: 1200px;
    display: flex;
    gap: 20px;
    padding: 20px;
    .sidebar {
        width: 320px;
        .ai-assistant-info {
            margin-bottom: 20px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(251, 146, 60, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(251, 146, 60, 0.08);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            .breathing-circle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
                animation: breathing 4s ease-in-out infinite;
                box-shadow: 0 6px 24px rgba(251, 146, 60, 0.25);
                position: relative;
            }
            .assistant-name {
                font-size: 16px;
                font-weight: 700;
                background: linear-gradient(135deg, #fb923c, #f59e0b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-align: center;
                background-clip: text;
                margin: 0 0 12px;
            }
            .online-status {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #059669;
                font-size: 12px;
                font-weight: 600;
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #059669;
                    border-radius: 50%;
                    margin-right: 8px;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 8px rgba(5, 150, 105, 0.4);
                }
            }
        }
        .session-history {
            background: white;
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            min-height: 250px;
            display: flex;
            flex-direction: column;
            .section-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin: 0 0 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                
            }
            .session-list {
                overflow-y: auto;
                max-height: 200px;
                scrollbar-width: thin;
                scrollbar-color: rgba(64, 150, 255, 0.3) transparent;
                .session-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    &:hover {
                        background: #f8f9ff;
                        border-color: #e6f0ff;
                    }
                    &.active {
                        background: #e6f0ff;
                        border-color: #4096ff;
                    }
                    .session-info {
                        flex: 1;
                        .session-title {
                            font-weight: 500;
                            font-size: 14px;
                            color: #333;
                            margin-bottom: 4px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            .session-meta {
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 6px;
                                .session-time {
                                    font-size: 12px;
                                    color: #999;
                                }
                            }
                            .session-preview {
                                width: 200px;
                                font-size: 12px;
                                color: #666;
                                margin-bottom: 6px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .session-stats {
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                span {
                                    font-size: 12px;
                                    color: #999;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                }
                            }
                        }
                        .session-actions {
                            position: absolute;
                            top: 10px;
                            right: 12px;
                        }
                    }
                }
                .no-sessions-text {
                    text-align: center;
                    font-size: 14px;
                    color: #999;
                }
            }
        }
        .emotion-garden {
            background: linear-gradient(135deg, #fef9e7 0%, #fcf4e6 50%, #f6f0e8 100%);
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(252, 244, 230, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            min-height: 300px;
            
            .garden-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                position: relative;
                z-index: 2;
                .garden-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #8b4513;
                }
            }
            .emotion-info {
                margin: 0 auto;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.8);
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                color: #fff;
                .emotion-name {
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1;
                    margin-bottom: 2px;
                }
                .emotion-score {
                    font-size: 14px;
                    font-weight: 700;
                    opacity: 0.9;
                }
            }
            .warm-tips {
                text-align: center;
                margin-bottom: 16px;
                .emotion-status-text {
                    margin-bottom: 12px;
                    .status-label {
                        font-size: 14px;
                        color: #8b7355;
                        margin-right: 8px;
                    }
                    .status-emotion {
                        font-size: 16px;
                        font-weight: 600;
                        padding: 4px 12px;
                        border-radius: 16px;
                        display: inline-block;
                    }
                }
                .emotion-intensity {
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    .intensity-dots {
                        display: flex;
                        gap: 4px;
                        .dot {
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: #e0e0e0;
                            transition: all 0.3s ease;
                            &.active {
                                background: linear-gradient(135deg, #ff9a9e, #fecfef);
                                transform: scale(1.2);
                                box-shadow: 0 2px 8px rgba(255, 154, 158, 0.4);
                            }
                        }
                    }
                    .intensity-text {
                        font-size: 12px;
                        color: #8b7355;
                        font-weight: 500;
                    }
                }
                .warm-suggestion {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
                    border-radius: 16px;
                    padding: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
                    .suggestion-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .suggestion-content {
                        text-align: left;
                        flex: 1;
                        .suggestion-title {
                            font-size: 14px;
                            font-weight: 600;
                            color: #8b7355;
                            margin-bottom: 6px;
                        }
                        .suggestion-text {
                            font-size: 13px;
                            color: #6b5b47;
                            line-height: 1.5;
                        }
                    }
                }
                .healing-actions {
                    margin-bottom: 16px;
                    .actions-title {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #8b7355;
                        margin-bottom: 16px;
                    }
                    .actions-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        .action-item {
                            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
                            border-radius: 12px;
                            padding: 12px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            border: 1px solid rgba(255, 255, 255, 0.5);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                            text-align: left;
                            .action-icon {
                                font-size: 14px;
                                color: #ffd700;
                                flex-shrink: 0;
                            }
                            .action-text {
                                font-size: 12px;
                                color: #6b5b47;
                                line-height: 1.4;
                                flex: 1;
                            }
                        }
                    }
                }
                .risk-notice {
                    background: linear-gradient(135deg, #fff9e6, #ffeaa7);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    border: 1px solid rgba(255, 234, 167, 0.6);
                    box-shadow: 0 6px 20px rgba(255, 234, 167, 0.3);
                    .notice-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .notice-content {
                        flex: 1;
                        .notice-title {
                            font-size: 14px;
                            font-weight: 600;
                            color: #d4840f;
                            margin-bottom: 6px;
                        }
                        .notice-text {
                            font-size: 13px;
                            color: #b8740c;
                            line-height: 1.5;
                        }
                    }
                }
            }
        }
    }
    .chat-main {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 252, 250, 0.98) 100%);
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(251, 146, 60, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(251, 146, 60, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        .chat-header {
            background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            flex-shrink: 0;
            .header-left {
                display: flex;
                align-items: center;
                .chat-avatar {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 1;
                }
                .chat-info {
                    h2 {
                        font-size: 20px;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    p {
                        font-size: 14px;
                    }
                }
            }
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 252, 248, 0.05) 100%);
            min-height: 0;
            max-height: calc(100vh - 200px);
            scrollbar-width: thin;
            scrollbar-color: rgba(251, 146, 60, 0.3) transparent;
            .messages-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                .messages-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: white;
                    flex-shrink: 0;
                }
                &.ai-messages {
                    .messages-avatar {
                        background: linear-gradient(135deg, #fb923c, #f59e0b);
                        box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
                    }
                }
                &.user-messages {
                    .messages-avatar {
                        background: linear-gradient(135deg, #6b7280, #4b5563);
                        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                    }
                }
                .messages-content {
                    max-width: 70%;
                    .messages-bubble {
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
                        border-radius: 16px;
                        padding: 12px 16px;
                        position: relative;
                        animation: fadeInUp 0.4s ease-out;
                        border: 1px solid rgba(251, 146, 60, 0.1);
                        box-shadow: 0 4px 16px rgba(251, 146, 60, 0.05);
                        .typing-indicator {
                            display: flex;
                            gap: 4px;
                            padding: 8px 0;
                            .typing-dot {
                                width: 8px;
                                height: 8px;
                                background: #ccc;
                                border-radius: 50%;
                                animation: typing 1.5s ease-in-out infinite;
                                &:nth-child(2) {
                                    animation-delay: 0.2s;
                                }
                                &:nth-child(3) {
                                    animation-delay: 0.4s;
                                }   
                            }
                        }
                        /* 错误消息样式 */
                        .error-messages {
                            background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%);
                            border: 1px solid #F87171;
                            border-radius: 12px;
                            padding: 12px 16px;
                            color: #991B1B;
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                    }
                    .messages-time {
                        font-size: 12px;
                        color: #999;
                        margin-top: 4px;
                    }
                }
            }
        }
        .chat-input {
            border-top: 1px solid rgba(251, 146, 60, 0.1);
            padding: 20px 24px;
            display: flex;
            gap: 12px;
            align-items: flex-end;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 252, 248, 0.7) 100%);
            backdrop-filter: blur(10px);
            flex-shrink: 0;
            .input-container {
                flex: 1;
            }
            .input-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #78716c;
                font-weight: 500;
            }
            .send-btn {
                height: 60px;
                width: 60px;
                border-radius: 16px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%) !important;
                border: none !important;
                box-shadow: 0 6px 20px rgba(251, 146, 60, 0.25);
                transition: all 0.3s ease;
            }

        }

    }
}
</style>