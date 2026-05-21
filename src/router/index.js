import { createRouter, createWebHistory } from "vue-router";
import BackendLayout from "@/components/BackendLayout.vue";
import AuthLayout from "@/components/AuthLayout.vue";
import FrontedLayout from '@/components/FrontedLayout.vue'

const backendRoutes = [
    {
        path: '/back',
        redirect: '/back/dashboard',
        component: BackendLayout,
        children: [
            {
                path: 'dashboard', //孩子不用加 /
                component: () => import('@/views/dashboard.vue'),
                meta: {
                    title: '数据分析',
                    icon: 'PieChart'
                }
            },

            {
                path: 'knowledge',
                component: () => import('@/views/knowledge.vue'),
                meta: {
                    title: '知识文章',
                    icon: 'ChatLineSquare'
                }
            },

            {
                path: 'consultations',
                component: () => import('@/views/consultations.vue'),
                meta: {
                    title: '咨询记录',
                    icon: 'Message',
                }
            },

            {
                path: 'emotional',
                component: () => import('@/views/emotional.vue'),
                meta: {
                    title: '情绪日志',
                    icon: 'User',
                }
            }
        ]
    },
    {
        path: '/auth',
        component: AuthLayout,
        children: [
            {
                path: 'login',
                component: () => import('@/views/login.vue'),
                meta: {
                    title: '登录',
                }
            },
            {
                path: 'register',
                component: () => import('@/views/register.vue'),
                meta: {
                    title: '注册',
                }
            }
        ]
    }
]

const frontendRoutes = [
    {
        path: '/',
        component: FrontedLayout,
        children: [
            {
                path: '',
                component: () => import('@/views/home.vue')
            },
            {
                path: 'consultation',
                component: () => import('@/views/consultation.vue')
            },
            {
                path: 'emotion-diary',
                component: () => import('@/views/emotionDiary.vue')
            },
            {
                path: 'knowledge',
                component: () => import('@/views/frontendKnowledge.vue')
            },
            {
                path: 'knowledge/article/:id',
                component: () => import('@/views/articleDetail.vue'),
                props: true
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes: [...backendRoutes, ...frontendRoutes]
})

//路由守卫
router.beforeEach((to, from, next) => {

    const token = localStorage.getItem('token')

    //判断当前用户是否登录
    if (token) {

        const userInfo = JSON.parse(localStorage.getItem('userInfo'))

        //判断有无权限--如果是后台用户(2)
        if (userInfo.userType == 2) {
            //后台用户只能访问后台界面 其他的返回后台首页
            if (to.path.startsWith('/back')) next();
            else next('/back/dashboard');

        } else if (userInfo.userType == 1) {
            //用户端账号只能访问前台路由（而且已注册的用户不能再回到注册/登录的界面）
            if (to.path.startsWith('/back') || to.path.startsWith('/auth')) {
                next('/');
            } else {
                next();
            }
        }

    } else {
        if (to.path === '/' || to.path.startsWith('/auth')) {
            next()
        } else {
            next('/auth/login')
        }
    }

})

export default router 