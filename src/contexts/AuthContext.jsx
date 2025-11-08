import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api/Api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userId, setUserId] = useState('default-user');
    const [userRole, setUserRole] = useState([]); // 'admin', 'lawyer', 'user'
    const [userName, setUserName] = useState(null);
    const [userEmail, setUserEmail] = useState(null); // Store user email
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Check if user is already logged in on app load
    useEffect(() => {
        const checkAuth = async () => {
            // Check both localStorage and sessionStorage
            const rememberMe = localStorage.getItem('rememberMe') === 'true';
            const storage = rememberMe ? localStorage : sessionStorage;

            const token = storage.getItem('token') || localStorage.getItem('token');
            const savedUser = storage.getItem('user') || localStorage.getItem('user');
            if (token) {
                try {
                    // Try to verify token with API
                    const response = await api.getCurrentUser();
                    if (response && response.success) {
                        const userData = response?.user || JSON.parse(savedUser || '{}');

                        // Verify email is admin@fahman.com
                        const userEmail = userData.email || userData.userName || '';


                        // Extract user role and name
                        // For admin@fahman.com, always set role to 'admin'
                        let role = userData.role || userData.userRole || userData.Role || ['user'];
                        const name = userData.name || userData.userName || userData.Name || userData.email || '';

                        setUserId(userData.id || userData.userId || 'admin-user');
                        setUserRole(role);
                        setUserName(name);
                        setUserEmail(userEmail || userData.email || userData.userName || ''); // Store email
                        setIsLoggedIn(true);
                    } else {
                        // Token invalid, clear storage
                        clearAuth();
                    }
                } catch (error) {
                    console.error('Auth check failed:', error);
                    // If token verification fails, check if we have saved user data
                    if (savedUser) {
                        try {
                            const userData = JSON.parse(savedUser);

                            // Verify email is admin@fahman.com
                            const userEmail = userData.email || userData.userName || '';


                            // For admin@fahman.com, always set role to 'admin'
                            const role = ['Admin']; // Force admin role for admin@fahman.com
                            const name = userData.name || userData.userName || userData.Name || userData.email || '';

                            setUserId(userData.id || userData.userId || 'admin-user');
                            setUserRole(role);
                            setUserName(name);
                            setUserEmail(userEmail || userData.email || userData.userName || ''); // Store email
                            setIsLoggedIn(true);
                        } catch (e) {
                            // Invalid user data, clear storage
                            clearAuth();
                        }
                    } else {
                        clearAuth();
                    }
                }
            }
            setIsCheckingAuth(false);
        };

        checkAuth();
    }, []);

    // Helper function to get storage based on rememberMe
    const getStorage = (rememberMe) => {
        return rememberMe ? localStorage : sessionStorage;
    };

    const clearAuth = () => {
        // Clear from both storages to be safe
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberMe');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('rememberMe');
        setIsLoggedIn(false);
        setUserId('default-user');
        setUserRole(null);
        setUserName(null);
        setUserEmail(null);
    };

    const login = async (identifier, password, rememberMe = false) => {
        setIsLoading(true);
        try {


            const response = await api.login(identifier, password);
            console.log('Login response:', response);

            if (response) {
                const responseData = response.data || response;

                // Double check email from response if available
                const userEmail = responseData.user?.email || responseData.email || identifier;


                // Determine which storage to use
                const storage = getStorage(rememberMe);

                // Clear the other storage to avoid conflicts
                if (rememberMe) {
                    sessionStorage.removeItem('token');
                    sessionStorage.removeItem('refreshToken');
                    sessionStorage.removeItem('user');
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                }

                // Save rememberMe preference
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    sessionStorage.setItem('rememberMe', 'false');
                    localStorage.removeItem('rememberMe');
                }

                // Save token if provided
                const token = responseData.token || responseData.accessToken || responseData.access_token;
                if (token) {
                    storage.setItem('token', token);
                }

                // Save refresh token if provided
                const refreshToken = responseData.refreshToken || responseData.refresh_token;
                if (refreshToken) {
                    storage.setItem('refreshToken', refreshToken);
                }

                // Save user data if provided
                const user = responseData.user || responseData.data || responseData;
                let userData;
                if (user && typeof user === 'object') {
                    userData = user;
                    storage.setItem('user', JSON.stringify(user));
                } else {
                    // If no user data, create a basic user object
                    userData = { id: responseData.id || 'admin-user-' + Date.now() };
                    storage.setItem('user', JSON.stringify(userData));
                }

                // Extract user role and name
                // For admin@fahman.com, always set role to 'admin'
                let role = userData.role || userData.userRole || userData.Role || 'user';

                const name = userData.name || userData.userName || userData.Name || userData.email || identifier;

                setUserId(userData.id || userData.userId || 'admin-user-' + Date.now());
                setUserRole(role);
                setUserName(name);
                setUserEmail(userEmail || userData.email || userData.userName || identifier); // Store email
                setIsLoggedIn(true);

                return {
                    success: true,
                    user: userData,
                };
            } else {
                return {
                    success: false,
                    message: response?.message || 'حدث خطأ ما',
                };
            }
        } catch (err) {
            console.error('Login error details:', {
                message: err.message,
                status: err.status,
                data: err,
                fullError: err,
            });

            // Extract error message from various possible locations
            const errorMessage =
                err.message ||
                err.message ||
                err.error ||
                err.errorMessage ||
                err.Error ||
                (err.status === 401 ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : null) ||
                (err.status === 404 ? 'الرابط غير موجود' : null) ||
                (err.status === 500 ? 'خطأ في الخادم' : null) ||
                'حدث خطأ ما';

            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            // Call logout API
            const response = await api.logout();
            console.log('Logout response:', response);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Always clear local storage even if API call fails
            clearAuth();
        }
    };

    const refreshToken = async () => {
        try {
            const response = await api.refreshToken();
            if (response && response.success) {
                const responseData = response.data || response;

                // Determine which storage to use based on rememberMe
                const rememberMe = localStorage.getItem('rememberMe') === 'true';
                const storage = getStorage(rememberMe);

                // Update token if provided
                const token = responseData.token || responseData.accessToken || responseData.access_token;
                if (token) {
                    storage.setItem('token', token);
                }

                // Update refresh token if provided
                const refreshToken = responseData.refreshToken || responseData.refresh_token;
                if (refreshToken) {
                    storage.setItem('refreshToken', refreshToken);
                }

                console.log('Token refreshed successfully');
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Refresh token error:', error);
            // If refresh fails, logout user
            clearAuth();
            return { success: false };
        }
    };

    const value = {
        isLoggedIn,
        userId,
        userRole,
        userName,
        userEmail,
        isCheckingAuth,
        isLoading,
        login,
        logout,
        refreshToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

