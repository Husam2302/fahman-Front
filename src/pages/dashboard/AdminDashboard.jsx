import React, { useState, useMemo, useEffect } from 'react';
import { LogIn, LayoutDashboard, FileText, PlusCircle, Languages, Users, Tag, Menu, X } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';
import CreateArticle from '../../components/articles/CreateArticle';
import ManageArticle from '../../components/articles/ManageArticle';
import ManageUsers from '../../components/users/ManageUsers';
import ManageCategories from '../../components/categories/ManageCategories';
import './AdminDashboard.css';

const AdminDashboard = ({ userId }) => {
    const { t, language, changeLanguage } = useTranslation();
    const { logout, userRole, userName, userEmail } = useAuth();
    const [activeTab, setActiveTab] = useState('manage');
    const [editingArticle, setEditingArticle] = useState(null); // Store article data for editing
    const [availableCategories, setAvailableCategories] = useState([]); // Store categories from articles
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile sidebar state

    const handleLogout = async () => {
        await logout();
    };

    const handleLanguageToggle = () => {
        const newLanguage = language === 'ar' ? 'en' : 'ar';
        changeLanguage(newLanguage);
    };


    const allTabs = [
        { id: 'manage', label: t('dashboard.tabs.manage'), icon: FileText, component: ManageArticle, roles: ['Admin', 'Lawyer'] },
        { id: 'create', label: t('dashboard.tabs.create'), icon: PlusCircle, component: CreateArticle, roles: ['Admin', 'Lawyer'] },
        { id: 'categories', label: t('dashboard.tabs.categories'), icon: Tag, component: ManageCategories, roles: ['Admin'] },
        { id: 'users', label: t('dashboard.tabs.users'), icon: Users, component: ManageUsers, roles: ['Admin'] },
    ];

    const tabs = useMemo(() => {
        return allTabs.filter(tab => {
            if (!tab.roles || tab.roles.length === 0) return true;

            const effectiveRoles = userRole || [];

            // Check if there is any overlap between user roles and tab roles
            return effectiveRoles?.some(role => tab.roles.includes(role));
        });
    }, [userRole, t]);


    const CurrentComponent = useMemo(() => {
        return tabs.find(t => t.id === activeTab)?.component;
    }, [tabs, activeTab]);


    useEffect(() => {
        const isValidTab = tabs.some(tab => tab.id === activeTab);
        if (!isValidTab && tabs.length > 0) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab]);

    // Handle article creation
    const handleArticleCreated = () => {
        setEditingArticle(null);
        if (activeTab === 'manage') {
            window.location.reload();
        } else {
            setActiveTab('manage');
        }
    };

    // Handle article edit 
    const handleEditArticle = (article) => {
        setEditingArticle(article);
        setActiveTab('create');
    };

    if (!CurrentComponent) {
        return null;
    }

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="dashboard">
            <header className="dashboard-header">
                <div className="dashboard-header-content">
                    <div className="dashboard-header-left">
                        <div className="dashboard-brand-wrapper">
                            <LayoutDashboard className="dashboard-icon" />
                            <span className="dashboard-brand">{t('app.name')}</span>
                        </div>
                        <span className="dashboard-subtitle">/ {t('app.adminPanel')}</span>
                    </div>
                    <div className="dashboard-header-right">
                        <span className="dashboard-user-id">
                            {userEmail || userName || `ID: ${userId || t('app.user')}`}
                        </span>
                        <button
                            onClick={handleLanguageToggle}
                            className="dashboard-language-btn"
                            title={t('app.switchLanguage')}
                        >
                            <Languages className="dashboard-language-icon" />
                            <span>{language === 'ar' ? 'EN' : 'AR'}</span>
                        </button>
                        <button
                            onClick={handleLogout}
                            className="dashboard-logout-btn"
                        >
                            <LogIn className="dashboard-logout-icon" />
                            <span>{t('app.logout')}</span>
                        </button>
                    </div>
                    {/* Mobile Menu Button */}
                    <button
                        className="dashboard-mobile-menu-btn"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="dashboard-mobile-menu-icon" />
                        ) : (
                            <Menu className="dashboard-mobile-menu-icon" />
                        )}
                    </button>
                </div>
            </header>

            {/* Mobile Sidebar */}
            <div className={`dashboard-mobile-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
                <div className="dashboard-mobile-sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
                <div className="dashboard-mobile-sidebar-content">
                    <div className="dashboard-mobile-sidebar-header">
                        <span className="dashboard-mobile-user-id">
                            {userEmail || userName || `ID: ${userId || t('app.user')}`}
                        </span>
                        <button
                            className="dashboard-mobile-sidebar-close"
                            onClick={() => setIsMobileMenuOpen(false)}
                            aria-label="Close menu"
                        >
                            <X className="dashboard-mobile-sidebar-close-icon" />
                        </button>
                    </div>
                    <div className="dashboard-mobile-sidebar-actions">
                        <button
                            onClick={() => {
                                handleLanguageToggle();
                                setIsMobileMenuOpen(false);
                            }}
                            className="dashboard-mobile-language-btn"
                        >
                            <Languages className="dashboard-mobile-language-icon" />
                            <span>{t('app.switchLanguage')}</span>
                            <span className="dashboard-mobile-language-value">{language === 'ar' ? 'EN' : 'AR'}</span>
                        </button>
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsMobileMenuOpen(false);
                            }}
                            className="dashboard-mobile-logout-btn"
                        >
                            <LogIn className="dashboard-mobile-logout-icon" />
                            <span>{t('app.logout')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <main className="dashboard-main">
                <div className={`dashboard-tabs ${language === 'ar' ? 'dashboard-tabs-rtl' : 'dashboard-tabs-ltr'}`}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`dashboard-tab ${isActive ? 'active' : ''}`}
                            >
                                <tab.icon className="dashboard-tab-icon" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="dashboard-content">
                    {activeTab === 'users' ? (
                        <CurrentComponent />
                    ) : activeTab === 'create' ? (
                        <CurrentComponent
                            userId={userId || 'default-user'}
                            onArticleCreated={handleArticleCreated}
                            editingArticle={editingArticle}
                            availableCategories={availableCategories}
                        />
                    ) : (
                        <CurrentComponent
                            userId={userId || 'default-user'}
                            onEditArticle={handleEditArticle}
                            onCategoriesLoaded={setAvailableCategories}
                        />
                    )}
                </div>
            </main>
            <footer className="dashboard-footer">
                &copy; {new Date().getFullYear()} {t('app.footer')}.
            </footer>
        </div>
    );
};

export default AdminDashboard;

