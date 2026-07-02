<template>
    <div class="knowledge-container">
        <div class="header-section">
            <div class="header-content">
                <el-image :src="iconUrl" style="width: 60px; height: 60px;"></el-image>
                <h1>情绪日志</h1>
            </div>
        </div>

        <!-- AI 知识库问答搜索区 -->
        <div class="ai-search-wrapper">
            <div class="ai-search-card">
                <div class="search-header">
                    <el-icon :size="20"><ChatDotRound /></el-icon>
                    <span class="search-title">AI 知识问答</span>
                    <span class="search-hint">基于知识库文章，为你解答心理健康问题</span>
                </div>
                <div class="search-input-row">
                    <el-input
                        v-model="aiQuery"
                        placeholder="试试问：如何缓解焦虑？"
                        size="large"
                        :disabled="isAiSearching"
                        @keydown.enter="handleAiSearch"
                        clearable
                    >
                        <template #append>
                            <el-button
                                type="primary"
                                @click="handleAiSearch"
                                :loading="isAiSearching"
                                :icon="Search"
                            >
                                {{ isAiSearching ? '思考中...' : 'AI 问答' }}
                            </el-button>
                        </template>
                    </el-input>
                </div>

                <!-- AI 回答区域 -->
                <div v-if="aiAnswer || isAiSearching" class="ai-answer-card">
                    <div class="answer-header">
                        <el-icon :size="18"><ChatDotRound /></el-icon>
                        <span>AI 回答</span>
                        <span v-if="isAiSearching" class="typing-badge">正在生成...</span>
                    </div>
                    <div class="answer-content">
                        <MarkdownRenderer
                            :content="aiAnswer || ' '"
                            :isAiMessage="true"
                        />
                    </div>
                    <!-- 错误提示 -->
                    <div v-if="aiError" class="ai-error">
                        <el-icon><WarningFilled /></el-icon>
                        <span>{{ aiError }}</span>
                    </div>
                    <!-- 参考文章 -->
                    <div v-if="matchedArticles.length > 0 && !isAiSearching && aiAnswer" class="references">
                        <div class="ref-title">📚 参考文章（基于你的问题匹配）</div>
                        <div
                            v-for="ref in matchedArticles"
                            :key="ref.id"
                            class="ref-item"
                            @click="goToArticle(ref.id)"
                        >
                            <el-icon><Document /></el-icon>
                            <span>{{ ref.title }}</span>
                            <el-tag size="small" type="info">{{ ref.categoryName }}</el-tag>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="content">
            <!-- 左侧菜单 -->
            <div class="recommend-section">
                <div class="section-title">推荐阅读</div>
                <div class="recommend-list">
                    <div class="recommend-item" v-for="item in recommendList" :key="item.id" @click="goToArticle(item.id)">
                        <h4 >{{ item.title }}</h4>
                        <p class="read-count"> 
                            <el-icon><Histogram/></el-icon>
                            阅读量：{{ item.readCount }}
                        </p>
                    </div>
                </div>
            </div>
            <!-- 右侧内容 -->
             <div class="article-list">
                <div class="article-item" v-for="item in articleList" :key="item.id" @click="goToArticle(item.id)">
                    <el-image style="width: 240px; height: 150px;" :src="getImage(item.coverImage)"></el-image>
                    <div class="info">
                        <div class="title">
                            <h3>{{ item.title }}</h3>
                            <el-tag Plain type="primary">{{ item.categoryName }}</el-tag>
                        </div>
                        <div :style="{marginTop: '10px'}">
                            <div class="flex-box">
                                <el-icon><Avatar /></el-icon>
                                <span>{{ item.authorName }}</span>
                            </div>
                            <div class="flex-box">
                                <el-icon><List/></el-icon>
                                <span>{{ dayjs(item.updateAt).format('YYYY-MM-DD') }}</span>
                            </div>
                        </div>
                        <div :style="{marginTop: '10px'}">
                            <div class="flex-box">
                                <el-icon><Platform /></el-icon>
                                <span>观看人数：{{ item.readCount }}</span>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
        <!-- 分页 -->
                <div class="pagination-wrapper">
                    <el-pagination
                        style="margin-top: 25px;"
                        :page-size="pagination.size"
                        layout="prev,pager,next"
                        :total="pagination.total"
                        @change="handleChange" 
                    />
                </div>
    </div>
</template>

<script setup>
import { Histogram, Platform, Search, ChatDotRound, WarningFilled, Document } from '@element-plus/icons-vue';
import { List } from '@element-plus/icons-vue';
import { ElMessage , dayjs } from 'element-plus';
import { getKnowledgeList } from '../api/frontend';
import { ref, onMounted, reactive } from 'vue';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import MarkdownRenderer from '../components/MarkdownRenderer.vue';
import router from '../router';

const iconUrl = new URL('@/assets/images/book.png',import.meta.url).href

const recommendList = ref([]);

//右侧列表数据
const pagination = reactive({
    currentPage: 1,
    size: 10,
    total: 0
});

const articleList = ref([]);

// ========== AI 知识问答相关状态 ==========
const aiQuery = ref('')                   // 用户输入的问题
const aiAnswer = ref('')                  // AI 流式回答
const isAiSearching = ref(false)          // 是否正在搜索中
const aiError = ref('')                   // 错误信息
const matchedArticles = ref([])           // 匹配到的参考文章

/**
 * AI 知识问答 — 前端关键词匹配 + SSE 流式请求
 * 
 * 流程：
 * 1. 校验登录状态（未登录提示）
 * 2. 校验输入非空
 * 3. 用用户 query 和 articleList 做关键词匹配，取前 5 条
 * 4. 构造 knowledgeContext（文章标题+摘要）
 * 5. fetchEventSource 发起 SSE 请求到 /api/ai-search
 * 6. onmessage 增量拼接 aiAnswer
 * 7. event: done 结束
 */
const handleAiSearch = () => {
    // 1. 校验登录
    const token = localStorage.getItem('token')
    if (!token) {
        ElMessage.warning('请先登录后再使用AI问答功能')
        return
    }

    // 2. 校验输入
    const query = aiQuery.value.trim()
    if (!query) {
        ElMessage.warning('请输入你想问的问题')
        return
    }

    // 重置状态
    aiAnswer.value = ''
    aiError.value = ''
    matchedArticles.value = []
    isAiSearching.value = true

    // 3. 关键词匹配：用用户 query 中的关键词匹配文章标题
    const keywords = query.split(/[\s,，。！？、]+/).filter(k => k.length > 0)
    
    const matched = articleList.value
        .map(article => {
            // 计算匹配度：标题中包含多少个关键词
            const matchCount = keywords.filter(kw =>
                article.title.toLowerCase().includes(kw.toLowerCase())
            ).length
            return { ...article, matchCount }
        })
        .filter(a => a.matchCount > 0)           // 只保留有匹配的
        .sort((a, b) => b.matchCount - a.matchCount) // 按匹配度降序
        .slice(0, 5)                              // 取前5条

    matchedArticles.value = matched

    // 4. 构造知识库上下文
    const knowledgeContext = matched.length > 0
        ? matched.map((a, i) => `${i + 1}. 标题：${a.title}\n   摘要：${a.summary || '暂无摘要'}`).join('\n\n')
        : ''  // 无匹配时传空，AI 用自己的知识回答

    // 5. 发起 SSE 流式请求
    const ctrl = new AbortController()
    let streamCompleted = false

    fetchEventSource('/api/ai-search', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Token': token,
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ query, knowledgeContext }),
        signal: ctrl.signal,
        openWhenHidden: true,

        onopen: (response) => {
            if (response.headers.get('Content-Type') !== 'text/event-stream') {
                aiError.value = '服务返回非流式数据，请稍后重试'
            }
        },

        onmessage: (event) => {
            if (streamCompleted) return

            const raw = event.data.trim()
            if (!raw) return

            if (event.event === 'done') {
                streamCompleted = true
                isAiSearching.value = false
                ctrl.abort()
                return
            }

            try {
                const payload = JSON.parse(raw)
                const code = String(payload.code)
                if (code === '200' && payload.data && payload.data.content) {
                    aiAnswer.value += payload.data.content
                } else if (code === '-1') {
                    aiError.value = payload.msg || 'AI问答失败'
                }
            } catch {
                // 跳过无法解析的数据
            }
        },

        onerror: (err) => {
            if (!streamCompleted) {
                aiError.value = 'AI服务连接失败，请稍后重试'
                isAiSearching.value = false
            }
            throw err  // 阻止重连
        },

        onclose: () => {
            if (!streamCompleted) {
                isAiSearching.value = false
            }
            throw new Error('stream closed')  // 阻止重连
        }
    })
}

//获取列表数据
const getPageList = () => {
    //后端接口需要的参数
    const params = {
        sortField:'publishedAt',
        sortDirection:'desc',
        ...pagination
    }

    getKnowledgeList(params).then(res => {
        //更新分页总数和列表数据 后端返回的数据
        pagination.total = res.total;
        articleList.value = res.records;
    })
}

//获取封面图片
const getImage = (url) => {
    // 后端返回的 coverImage 已包含 /files 前缀，直接使用即可
    return url || 'https://file.itndedu.com/psychology_ai.png'
}

//分页变化
const handleChange = (page) => {
    pagination.currentPage = page;
    getPageList();
}

//跳转到文章详情
const goToArticle = (id) => {
    router.push(`/knowledge/article/${id}`);
}


onMounted(() => {
    //获取推荐阅读列表
    const params = {
        sortField: 'readCount',
        sortDirection: 'desc',
        currentPage: 1,
        size: 5
    }
    getPageList()
    getKnowledgeList(params).then(res => {
        recommendList.value = res.records;
    })
});
</script>

<style lang="scss" scoped>
.knowledge-container {
    background: linear-gradient(135deg, #fafbfc 0%, #f7f9fc 50%, #f2f6fa 100%);
    .flex-box {
        display: flex;
        align-items: center;
        span {
            margin-left: 10px;
        }
    }
    .header-section {
        background: linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%);
        color: white;
        padding: 48px;
        .header-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }
    }

    /* ===== AI 问答搜索区 ===== */
    .ai-search-wrapper {
        margin: 0 auto;
        max-width: 1200px;
        padding: 20px 20px 0 20px;
    }
    .ai-search-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
        border: 1px solid #e5e7eb;
        .search-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            .search-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
            }
            .search-hint {
                font-size: 13px;
                color: #9ca3af;
                margin-left: 8px;
            }
            .el-icon {
                color: #8b5cf6;
            }
        }
        .search-input-row {
            margin-bottom: 0;
        }
        .ai-answer-card {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #f3f4f6;
            .answer-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                font-size: 15px;
                font-weight: 600;
                color: #374151;
                .el-icon {
                    color: #8b5cf6;
                }
                .typing-badge {
                    font-size: 12px;
                    color: #8b5cf6;
                    font-weight: 400;
                    animation: pulse 1.5s ease-in-out infinite;
                }
            }
            .answer-content {
                background: #f9fafb;
                border-radius: 12px;
                padding: 16px 20px;
                border-left: 4px solid #8b5cf6;
            }
            .ai-error {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
                padding: 10px 16px;
                background: #fef2f2;
                border-radius: 8px;
                color: #dc2626;
                font-size: 14px;
            }
            .references {
                margin-top: 16px;
                .ref-title {
                    font-size: 13px;
                    font-weight: 600;
                    color: #6b7280;
                    margin-bottom: 8px;
                }
                .ref-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    margin-bottom: 6px;
                    background: #f0fdf4;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 1px solid #dcfce7;
                    &:hover {
                        background: #dcfce7;
                        border-color: #86efac;
                    }
                    .el-icon {
                        color: #22c55e;
                    }
                    span {
                        flex: 1;
                        font-size: 14px;
                        color: #374151;
                    }
                }
            }
        }
    }

    .content {
        display: flex;
        gap: 20px;
        margin: 0 auto;
        width: 1200px;
        padding: 20px;
        .recommend-section {
            width: 280px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            padding: 15px;
            height: 400px;
            .section-title {
                font-size: 12;
                font-weight: 600;
                color: #374151;
                margin-bottom: 10px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .recommend-list {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                .recommend-item {
                    border-left: 4px solid #f59e0b;
                    padding-left: 10px;
                    cursor: pointer;
                    .read-count {
                        margin-top: 15px;
                        font-size: 12px;
                        color: #6b7280;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                }
            }
        }
        .article-list {
            flex: 1;
            .article-item {
                background: white;
                border-radius: 12px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
                padding: 15px;
                margin-bottom: 20px;
                display: flex;
                .info {
                    margin-left: 20px;
                    .title {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }
                }
            }
        }
    }
    .pagination-wrapper {
        display: flex;
        justify-content: center;
        padding-bottom: 30px;
    }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>