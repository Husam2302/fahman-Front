import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Mail, Shield, Loader2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import api from '../../services/api/Api';
import './users.css';

const USERS_PER_PAGE = 10;

const ManageUsers = () => {
    const { t, language } = useTranslation();
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingUserId, setEditingUserId] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPagesFromAPI, setTotalPagesFromAPI] = useState(1);
    const [totalUsersFromAPI, setTotalUsersFromAPI] = useState(0);

    const loadUsers = async (page = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getAllUsers({
                page: page,
                limit: USERS_PER_PAGE,
                search: searchQuery || null,
            });


            if (response) {
                if (!Array.isArray(response?.items)) {
                    setError(response.message || t('users.loadError'));
                    setUsers([]);
                    setTotalPagesFromAPI(1);
                    setTotalUsersFromAPI(0);
                    return;
                }

                if (Array.isArray(response?.items)) {
                    let usersData = Array.isArray(response) ? response : (response.data || response);


                    if (!Array.isArray(usersData)) {
                        if (usersData && Array.isArray(usersData.users)) {
                            usersData = usersData.users;
                        } else if (usersData && Array.isArray(usersData.data)) {
                            usersData = usersData.data;
                        } else if (usersData && Array.isArray(usersData.items)) {
                            usersData = usersData.items;
                        } else if (usersData && typeof usersData === 'object' && usersData !== null) {
                            const keys = Object.keys(usersData);


                            for (const key of keys) {
                                if (Array.isArray(usersData[key])) {
                                    usersData = usersData[key];
                                    break;
                                }
                            }

                            if (!Array.isArray(usersData)) {
                                usersData = [usersData];
                            }
                        } else {
                            usersData = [];
                        }
                    }

                    const mappedUsers = usersData.map((user, index) => {

                        const mappedUser = {
                            id: user.id,
                            name: user.userName,
                            email: user.email,
                            role: user.role
                        };




                        return mappedUser;
                    });

                    setUsers(mappedUsers);

                    // Update pagination info if provided by API
                    const responseData = response.data || {};
                    if (response.pagination) {
                        setTotalPagesFromAPI(response.pagination.totalPages || 1);
                        setTotalUsersFromAPI(response.pagination.totalItems || mappedUsers.length);
                    } else if (response.totalPages) {
                        setTotalPagesFromAPI(response.totalPages);
                        setTotalUsersFromAPI(response.total || mappedUsers.length);
                    } else if (responseData.pagination) {
                        setTotalPagesFromAPI(responseData.pagination.totalPages || 1);
                        setTotalUsersFromAPI(responseData.pagination.totalItems || mappedUsers.length);
                    } else if (responseData.totalPages) {
                        setTotalPagesFromAPI(responseData.totalPages);
                        setTotalUsersFromAPI(responseData.total || mappedUsers.length);
                    } else {
                        setTotalPagesFromAPI(Math.ceil(mappedUsers.length / USERS_PER_PAGE) || 1);
                        setTotalUsersFromAPI(mappedUsers.length);
                    }
                } else {
                    setError(t('users.loadError'));
                    setUsers([]);
                    setTotalPagesFromAPI(1);
                    setTotalUsersFromAPI(0);
                }
            } else {
                setError(t('users.loadError'));
                setUsers([]);
                setTotalPagesFromAPI(1);
                setTotalUsersFromAPI(0);
            }
        } catch (err) {
            // Error details available in err object


            let errorMessage = err.message || t('users.loadError');
            if (err.status === 403) {
                errorMessage = 'غير مصرح لك بالوصول إلى هذه البيانات. يرجى التأكد من تسجيل الدخول كمسؤول.';
            } else if (err.status === 401) {
                errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
            } else if (err.status === 404) {
                errorMessage = 'الرابط غير موجود. يرجى التحقق من الـ API endpoint.';
            } else if (err.status === 0) {
                errorMessage = 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.';
            }

            setError(errorMessage);
            setUsers([]);
            setTotalPagesFromAPI(1);
            setTotalUsersFromAPI(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditRole = (user) => {
        setEditingUserId(user.id);
        setSelectedRole(user.role === 'مسؤول' ? 'Admin' : user.role === 'محامي' ? 'Lawyer' : user.role === "مستخدم" ? 'Customer' : user.role);
    };

    const handleSaveRole = async (userId) => {
        try {
            console.log('Updating user role:', { userId, role: selectedRole });
            const response = await api.updateUserRole(userId, selectedRole);
            console.log('Update role response:', response);

            if (response) {
                // Update local state
                setUsers(users.map(user =>
                    user.id === userId ? {
                        ...user, role: t(`users.roles.${selectedRole}`)
                    } : user
                ));
                setEditingUserId(null);
                setSelectedRole('');
                setError(null);

            } else {
                setError(t('users.updateError'));
            }
        } catch (err) {
            console.error('Error updating user role:', err);
            const errorMsg = err.status === 401
                ? 'غير مصرح لك بتعديل الصلاحيات. يرجى تسجيل الدخول كمسؤول.'
                : err.message || t('users.updateError');
            setError(errorMsg);
        }
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setSelectedRole('');
    };

    // Load users when page changes
    useEffect(() => {
        loadUsers(currentPage);
    }, [currentPage]);

    // Reload users when search query changes 
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (currentPage === 1) {
                loadUsers(1);
            } else {
                setCurrentPage(1);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const totalPages = Math.max(1, totalPagesFromAPI || Math.ceil(users.length / USERS_PER_PAGE));
    const paginatedUsers = users;

    const handlePageChange = (page) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };



    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
            } else if (currentPage >= totalPages - 2) {
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                    pages.push(i);
                }
            }
        }
        return pages;
    };

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="users-management">
            <div className="users-header">
                <div className="users-title-wrapper">
                    <h2 className="users-title">
                        {t('users.title')} ({totalUsersFromAPI || users.length})
                    </h2>
                    {totalPages > 1 && (
                        <span className="users-page-info">
                            {t('users.pageInfo').replace('{{current}}', currentPage).replace('{{total}}', totalPages)}
                        </span>
                    )}
                </div>
                <div className="users-search-wrapper">
                    <Search className="users-search-icon" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('users.searchPlaceholder')}
                        className="users-search-input"
                    />
                </div>
            </div>

            {isLoading && (
                <div className="users-loading">
                    <Loader2 className="users-loading-spinner article-spinner" />
                    <p className="users-loading-text">{t('users.loading')}</p>
                </div>
            )}

            {error && !users.length && <p className="users-error">{error}</p>}

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>{t('users.table.name')}</th>
                            <th>{t('users.table.email')}</th>
                            <th>{t('users.table.role')}</th>
                            <th>{t('users.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="users-empty">
                                    {t('users.empty')}
                                </td>
                            </tr>
                        ) : (
                            paginatedUsers.map((user) => (
                                <tr key={user.id} className="users-table-row">
                                    <td>
                                        <div className="users-name-cell">
                                            <User className="users-name-icon" />
                                            <span>{user.name || t('users.noName')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="users-email-cell">
                                            <Mail className="users-email-icon" />
                                            <span>{user.email || t('users.noEmail')}</span>
                                        </div>
                                    </td>
                                    <td>
                                        {editingUserId === user.id ? (
                                            <select
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                className="users-role-select"
                                            >
                                                <option value="Customer">{t('users.roles.user')}</option>
                                                <option value="Lawyer">{t('users.roles.lawyer')}</option>
                                                <option value="Admin">{t('users.roles.Admin')}</option>
                                            </select>
                                        ) : (
                                            <span className={`users-role-badge ${(user.role === 'Admin' || user.role === 'مسؤوول') ? 'lawyer' : 'user'}`}>
                                                <Shield className="users-role-icon" />
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        {editingUserId === user.id ? (
                                            <div className="users-actions">
                                                <button
                                                    onClick={() => handleSaveRole(user.id)}
                                                    className="users-save-btn"
                                                    title={t('users.save')}
                                                >
                                                    {t('users.save')}
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="users-cancel-btn"
                                                    title={t('users.cancel')}
                                                >
                                                    {t('users.cancel')}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleEditRole(user)}
                                                className="users-edit-btn"
                                                title={t('users.editRole')}
                                            >
                                                <Edit className="users-edit-icon" />
                                                <span>{t('users.editRole')}</span>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && users.length > 0 && (
                <div className="users-pagination">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="users-pagination-btn"
                        title={t('users.previousPage')}
                    >
                        <ChevronLeft className="users-pagination-icon" />
                        <span>{t('users.previous')}</span>
                    </button>

                    <div className="users-pagination-numbers">
                        {getPageNumbers().map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`users-pagination-number ${currentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="users-pagination-btn"
                        title={t('users.nextPage')}
                    >
                        <span>{t('users.next')}</span>
                        <ChevronRight className="users-pagination-icon" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;

