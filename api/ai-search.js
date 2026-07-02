/**
 * AI 知识库问答 - Vercel Serverless Function
 */

export default async function handler(req, res) {
    // 只接受 POST
    if (req.method !== 'POST') {
        res.status(405).json({ code: '-1', msg: 'Method not allowed' })
        return
    }

    // 验证 token
    const token = req.headers['token'] || req.headers['Token'] || ''
    if (!token) {
        res.status(401).json({ code: '-1', msg: '请先登录' })
        return
    }

    // 解析 body（Node.js runtime 中 req 没有 .json()，需手动读取）
    let body
    try {
        const rawBody = await new Promise((resolve, reject) => {
            const chunks = []
            req.on('data', chunk => chunks.push(chunk))
            req.on('end', () => resolve(Buffer.concat(chunks).toString()))
            req.on('error', reject)
        })
        body = JSON.parse(rawBody)
    } catch {
        res.status(400).json({ code: '-1', msg: '请求参数格式错误' })
        return
    }

    const { query, knowledgeContext } = body
    if (!query || !query.trim()) {
        res.status(400).json({ code: '-1', msg: '请输入问题' })
        return
    }

    // 设置 SSE 头
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    })

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
        res.write(`event: error\ndata: ${JSON.stringify({ code: '-1', msg: 'API Key 未设置' })}\n\n`)
        res.write(`event: done\ndata: {}\n\n`)
        res.end()
        return
    }

    const prompt = `你是一个温暖、专业的心理健康AI助手。

【知识库参考内容】
${knowledgeContext || '暂无相关知识库文章'}

【用户问题】
${query}

要求：用温暖共情的语气回答，控制在300字以内，Markdown格式。`

    try {
        const aiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ role: 'user', content: prompt }],
                stream: true,
                max_tokens: 800,
                temperature: 0.7
            })
        })

        if (!aiResponse.ok) {
            const errText = await aiResponse.text()
            res.write(`event: error\ndata: ${JSON.stringify({ code: '-1', msg: 'AI服务返回错误: ' + aiResponse.status })}\n\n`)
            res.write(`event: done\ndata: {}\n\n`)
            res.end()
            return
        }

        // 流式读取 DeepSeek → 转发给前端
        const reader = aiResponse.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''

            for (const line of lines) {
                const trimmed = line.trim()
                if (!trimmed || !trimmed.startsWith('data: ')) continue

                const dataStr = trimmed.replace('data: ', '')
                if (dataStr === '[DONE]') {
                    res.write(`event: done\ndata: {}\n\n`)
                    res.end()
                    return
                }
                try {
                    const parsed = JSON.parse(dataStr)
                    const content = parsed.choices?.[0]?.delta?.content || ''
                    if (content) {
                        res.write(`data: ${JSON.stringify({ code: '200', data: { content } })}\n\n`)
                    }
                } catch { /* skip */ }
            }
        }

        res.write(`event: done\ndata: {}\n\n`)
        res.end()

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error)
        res.write(`event: error\ndata: ${JSON.stringify({ code: '-1', msg })}\n\n`)
        res.write(`event: done\ndata: {}\n\n`)
        res.end()
    }
}