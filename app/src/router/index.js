import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

// Layouts
import MainLayout from '../layouts/MainLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

// Public pages
import HomePage from '../pages/HomePage.vue'
import SeriesPage from '../pages/SeriesPage.vue'
import MoviesPage from '../pages/MoviesPage.vue'
import MyListPage from '../pages/MyListPage.vue'
import WatchMovie from '../pages/WatchMovie.vue'

// Admin pages
import LoginPage from '../pages/admin/LoginPage.vue'
import DashboardPage from '../pages/admin/DashboardPage.vue'
import FilmsPage from '../pages/admin/FilmsPage.vue'
import FilmEditPage from '../pages/admin/FilmEditPage.vue'
import GenresPage from '../pages/admin/GenresPage.vue'
import FAQsPage from '../pages/admin/FAQsPage.vue'
import ThemesPage from '../pages/admin/ThemesPage.vue'
import SettingsPage from '../pages/admin/SettingsPage.vue'

const routes = [
    // Public routes
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: '',
                name: 'home',
                component: HomePage
            },
            {
                path: 'series',
                name: 'series',
                component: SeriesPage
            },
            {
                path: 'movies',
                name: 'movies',
                component: MoviesPage
            },
            {
                path: 'my-list',
                name: 'my-list',
                component: MyListPage
            }
        ]
    },

    // Watch Movie route
    {
        path: '/watch/:slug',
        name: 'watch-movie',
        component: WatchMovie
    },

    // Public Film Challenge route (No auth required)
    {
        path: '/challenge/:slug?',
        name: 'public-challenge',
        component: () => import('../pages/ChallengePage.vue')
    },


    // Admin login (no auth required)
    {
        path: '/admin/login',
        name: 'admin-login',
        component: LoginPage
    },

    // Admin routes (auth required)
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/admin/dashboard'
            },
            {
                path: 'dashboard',
                name: 'admin-dashboard',
                component: DashboardPage
            },
            {
                path: 'films',
                name: 'admin-films',
                component: FilmsPage
            },
            {
                path: 'films/new',
                name: 'admin-films-new',
                component: FilmEditPage
            },
            {
                path: 'films/:id',
                name: 'admin-films-edit',
                component: FilmEditPage
            },
            {
                path: 'genres',
                name: 'admin-genres',
                component: GenresPage
            },
            {
                path: 'challenges',
                name: 'admin-challenges',
                component: () => import('../pages/admin/ChallengesPage.vue')
            },
            {
                path: 'faqs',
                name: 'admin-faqs',
                component: FAQsPage
            },
            {
                path: 'themes',
                name: 'admin-themes',
                component: ThemesPage
            },
            {
                path: 'settings',
                name: 'admin-settings',
                component: SettingsPage
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Check if route requires authentication
    if (to.meta.requiresAuth) {
        // Check auth state
        if (!authStore.user) {
            // Try to restore session
            await authStore.checkAuth()
        }

        // If still not authenticated, redirect to login
        if (!authStore.isAuthenticated()) {
            next('/admin/login')
            return
        }
    }

    // If already authenticated and trying to access login, redirect to dashboard
    if (to.path === '/admin/login' && authStore.isAuthenticated()) {
        next('/admin/dashboard')
        return
    }

    next()
})

export default router
