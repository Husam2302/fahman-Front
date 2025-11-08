import axios from 'axios';

const BASE_URL = 'http://fahmaan.runasp.net';
// const BASE_URL = 'https://localhost:7087';

var language = localStorage.getItem('language') || 'ar';
const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': language
    },
});

// === Helper functions ===
const getToken = () =>
    localStorage.getItem('token') || sessionStorage.getItem('token');

const getRefreshToken = () =>
    localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');

// === Request Interceptor ===
apiClient.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) config.headers['Authorization'] = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// === Response Interceptor (Refresh Token) ===
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Handle unauthorized (401)
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Wait for refresh
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return apiClient(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error('No refresh token');

                const response = await axios.post(`${BASE_URL}/auth/refresh-token/${refreshToken}`);

                const newToken = response.data?.token || response.data?.accessToken;
                if (!newToken) throw new Error('No new token returned');

                localStorage.setItem('token', newToken);
                localStorage.setItem('refreshToken', response.data?.refreshToken || refreshToken);
                sessionStorage.setItem('token', newToken);

                apiClient.defaults.headers['Authorization'] = `Bearer ${newToken}`;
                processQueue(null, newToken);
                return apiClient(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// === API Methods ===
const api = {
    async login(identifier, password) {
        try {
            const response = await apiClient.post('/auth/login', {
                Identifer: identifier,
                password,
            });
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getCurrentUser() {
        try {
            const response = await apiClient.get('/Auth/GetUserInfo');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async logout() {
        try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) return { success: true };

            const response = await apiClient.post(`/auth/logout/${refreshToken}`);
            return response.data;
        } catch {
            return { success: true };
        }
    },

    async getAllUsers(params = {}) {
        try {
            const { page = 1, limit = 10, search = null } = params;
            const queryParams = new URLSearchParams({
                PageNumber: page,
                PageSize: limit,
            });
            if (search) queryParams.append('search', search);

            const response = await apiClient.get(
                `/api/RoleManagement/all-users?${queryParams}`
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async updateUserRole(userId, role) {
        try {
            const response = await apiClient.put(
                `/api/RoleManagement/update-role`,
                { UserId: userId, Role: role }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getArticles(params = {}) {
        try {
            const queryParams = new URLSearchParams(params).toString();
            const response = await apiClient.get(
                `/api/Article${queryParams ? `?${queryParams}` : ''}`
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getArticleById(articleId) {
        try {
            const response = await apiClient.get(`/api/Article/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async createArticle(articleData) {
        try {
            const formData = new FormData();

            // Regular fields
            if (articleData.title) formData.append('Title', articleData.title);
            if (articleData.content) formData.append('Content', articleData.content);

            // CategoryIds array
            if (Array.isArray(articleData.categoryIds)) {
                articleData.categoryIds.forEach(id => formData.append('CategoryIds', id));
            }

            // Image
            if (articleData.featuredImage instanceof File) {
                formData.append('FeaturedImage', articleData.featuredImage);
            }

            const response = await apiClient.post('/api/Article', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
    ,

    async updateArticle(articleId, articleData) {
        const formData = new FormData();

        // Regular fields
        if (articleData.title) formData.append('Title', articleData.title);
        if (articleData.content) formData.append('Content', articleData.content);

        // CategoryIds array
        if (Array.isArray(articleData.categoryIds)) {
            articleData.categoryIds.forEach(id => formData.append('CategoryIds', id));
        }

        // Image
        if (articleData.featuredImage instanceof File) {
            formData.append('FeaturedImage', articleData.featuredImage);
        }
        try {
            const response = await apiClient.put(
                `/api/Article/${articleId}`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async deleteArticle(articleId) {
        try {
            const response = await apiClient.delete(`/api/Article/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getArticlesByAuthor(authorId) {
        try {
            const response = await apiClient.get(`/api/Article/auther/${authorId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getArticlesByCategory(categoryId) {
        try {
            const response = await apiClient.get(
                `/api/Article/category/${categoryId}`
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getCategories() {
        try {
            const response = await apiClient.get('/api/Category');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getCategoryById(categoryId) {
        try {
            const response = await apiClient.get(`/api/Category/${categoryId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async createCategory(categoryData) {
        try {
            const response = await apiClient.post('/api/Category', categoryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async updateCategory(categoryId, categoryData) {
        try {
            const response = await apiClient.put(
                `/api/Category/${categoryId}`,
                categoryData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async deleteCategory(categoryId) {
        try {
            const response = await apiClient.delete(`/api/Category/${categoryId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async toggleLike(articleId) {
        try {
            const response = await apiClient.post(`/api/Like/toggle/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getLikeCount(articleId) {
        try {
            const response = await apiClient.get(`/api/Like/count/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async checkLike(articleId) {
        try {
            const response = await apiClient.get(`/api/Like/check/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getArticleComments(articleId) {
        try {
            const response = await apiClient.get(`/api/Comment/article/${articleId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async getCommentById(commentId) {
        try {
            const response = await apiClient.get(`/api/Comment/${commentId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async createComment(commentData) {
        try {
            const response = await apiClient.post('/api/Comment', commentData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async updateComment(commentId, commentData) {
        try {
            const response = await apiClient.put(
                `/api/Comment/${commentId}`,
                commentData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    async deleteComment(commentId) {
        try {
            const response = await apiClient.delete(`/api/Comment/${commentId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },
};

export default api;
