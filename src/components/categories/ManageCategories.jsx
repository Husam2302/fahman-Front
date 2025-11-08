import React, { useState, useEffect } from 'react';
import { Trash2, Loader2, Plus, Edit, X, Check } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api/Api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import './categories.css';

const ManageCategories = () => {
    const { t, language } = useTranslation();
    const { userRole } = useAuth();
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null, categoryName: null, isDeleting: false });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getCategories();

            let categoriesData = [];
            if (response && response.success) {
                categoriesData = response.data || [];
            } else if (Array.isArray(response)) {
                categoriesData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                categoriesData = response.data;
            }

            const mappedCategories = categoriesData.map(cat => ({
                id: cat._id || cat.id || cat.Id,
                name: cat.name || cat.Name || '',
                nameAr: cat.nameAr || cat.NameAr || cat.name || cat.Name || '',
                nameEn: cat.nameEn || cat.NameEn || cat.name || cat.Name || '',
            }));

            setCategories(mappedCategories);
        } catch (err) {
            console.error('Error loading categories:', err);
            let errorMessage = err.message || t('categories.loadError');
            if (err.status === 403) {
                errorMessage = 'غير مصرح لك بالوصول إلى هذه البيانات. يرجى التأكد من تسجيل الدخول كمسؤول.';
            } else if (err.status === 401) {
                errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
            }
            setError(errorMessage);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newCategoryName.trim()) {
            setError(t('categories.nameRequired') || 'اسم التصنيف مطلوب');
            return;
        }

        setIsAdding(true);
        setError(null);

        try {
            const categoryData = {
                name: newCategoryName.trim(),
            };

            const response = await api.createCategory(categoryData);

            if (response && response?.name) {
                setNewCategoryName('');
                await loadCategories();
                setError(null);
            } else {
                setError(t('categories.addError') || 'فشل إضافة التصنيف');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            const errorMessage = error.message || t('categories.addError') || 'فشل إضافة التصنيف';
            setError(errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    const handleEdit = (category) => {
        setEditingId(category.id);
        setEditingName(category.name || category.nameAr || category.nameEn || '');
    };

    const handleSaveEdit = async (categoryId) => {
        if (!editingName.trim()) {
            setError(t('categories.nameRequired') || 'اسم التصنيف مطلوب');
            return;
        }

        setError(null);

        try {
            const categoryData = {
                name: editingName.trim(),
            };

            const response = await api.updateCategory(categoryId, categoryData);

            if (response && response?.name) {
                setEditingId(null);
                setEditingName('');
                await loadCategories();
                setError(null);
            } else {
                setError(t('categories.updateError') || 'فشل تحديث التصنيف');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            const errorMessage = error.message || t('categories.updateError') || 'فشل تحديث التصنيف';
            setError(errorMessage);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
        setError(null);
    };

    const handleDeleteClick = (categoryId, categoryName) => {
        setDeleteModal({
            isOpen: true,
            categoryId: categoryId,
            categoryName: categoryName || t('categories.unknown') || 'تصنيف غير معروف',
            isDeleting: false
        });
    };

    const handleDeleteConfirm = async () => {
        const { categoryId } = deleteModal;
        if (!categoryId) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        setError(null);

        try {
            const response = await api.deleteCategory(categoryId);

            if (response == "") {
                await loadCategories();
                setError(null);
                setDeleteModal({ isOpen: false, categoryId: null, categoryName: null, isDeleting: false });
            } else {
                setError(t('categories.deleteError') || 'فشل حذف التصنيف');
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            const errorMessage = error.message || t('categories.deleteError') || 'فشل حذف التصنيف';
            setError(errorMessage);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, categoryId: null, categoryName: null, isDeleting: false });
    };

    // Only admin can manage categories
    if (userRole.includes('Admin') === false) {
        return (
            <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="categories-management">
                <p className="categories-error">{t('categories.noPermission') || 'غير مصرح لك بالوصول إلى هذه الصفحة'}</p>
            </div>
        );
    }

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="categories-management">
            <div className="categories-header">
                <h2 className="categories-title">{t('categories.title') || 'إدارة التصنيفات'}</h2>
            </div>

            {isLoading && (
                <div className="categories-loading">
                    <Loader2 className="categories-loading-spinner article-spinner" />
                    <p className="categories-loading-text">{t('categories.loading') || 'جار التحميل...'}</p>
                </div>
            )}

            {error && <p className="categories-error">{error}</p>}

            {!isLoading && (
                <>
                    <div className="categories-add-section">
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder={t('categories.namePlaceholder') || 'اسم التصنيف الجديد'}
                            className="categories-input"
                            disabled={isAdding}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleAdd();
                                }
                            }}
                        />
                        <button
                            onClick={handleAdd}
                            className="categories-add-btn"
                            disabled={isAdding || !newCategoryName.trim()}
                        >
                            {isAdding ? (
                                <Loader2 className="categories-btn-icon article-spinner" />
                            ) : (
                                <Plus className="categories-btn-icon" />
                            )}
                            <span>{t('categories.add') || 'إضافة'}</span>
                        </button>
                    </div>

                    <div className="categories-list">
                        {categories.length === 0 ? (
                            <p className="categories-empty">{t('categories.empty') || 'لا توجد تصنيفات'}</p>
                        ) : (
                            categories.map((category) => (
                                <div key={category.id} className="categories-item">
                                    {editingId === category.id ? (
                                        <>
                                            <input
                                                type="text"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="categories-edit-input"
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleSaveEdit(category.id);
                                                    } else if (e.key === 'Escape') {
                                                        handleCancelEdit();
                                                    }
                                                }}
                                                autoFocus
                                            />
                                            <div className="categories-item-actions">
                                                <button
                                                    onClick={() => handleSaveEdit(category.id)}
                                                    className="categories-save-btn"
                                                    title={t('categories.save') || 'حفظ'}
                                                >
                                                    <Check className="categories-btn-icon" />
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="categories-cancel-btn"
                                                    title={t('categories.cancel') || 'إلغاء'}
                                                >
                                                    <X className="categories-btn-icon" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="categories-item-name">
                                                {language === 'ar'
                                                    ? (category.nameAr || category.name || category.nameEn)
                                                    : (category.nameEn || category.name || category.nameAr)
                                                }
                                            </span>
                                            <div className="categories-item-actions">
                                                <button
                                                    onClick={() => handleEdit(category)}
                                                    className="categories-edit-btn"
                                                    title={t('categories.edit') || 'تعديل'}
                                                >
                                                    <Edit className="categories-btn-icon" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(category.id, language === 'ar' ? (category.nameAr || category.name || category.nameEn) : (category.nameEn || category.name || category.nameAr))}
                                                    className="categories-delete-btn"
                                                    title={t('categories.delete') || 'حذف'}
                                                >
                                                    <Trash2 className="categories-btn-icon" />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={t('categories.delete') || 'حذف التصنيف'}
                message={t('categories.confirmDelete') || 'هل أنت متأكد أنك تريد حذف هذا التصنيف؟'}
                itemName={deleteModal.categoryName}
                isLoading={deleteModal.isDeleting}
            />
        </div>
    );
};

export default ManageCategories;

