import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Send, PlusCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import api from '../../services/api/Api';
import Button from '../button/Button';
import './article.css';

const CreateArticle = ({ userId, onArticleCreated, editingArticle, availableCategories = [] }) => {
    const { t, language } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [articleId, setArticleId] = useState(null); // Store article ID when editing

    // Load categories from API
    const [categories, setCategories] = useState([]);

    // Load categories from API
    useEffect(() => {
        loadCategories();
    }, [language]); // Reload when language changes

    const loadCategories = async () => {
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
                key: (cat._id || cat.id || cat.Id).toString(),
                id: cat._id || cat.id || cat.Id,
                label: language === 'ar'
                    ? (cat.nameAr || cat.NameAr || cat.name || cat.Name || cat.nameEn || cat.NameEn)
                    : (cat.nameEn || cat.NameEn || cat.name || cat.Name || cat.nameAr || cat.NameAr)
            }));

            setCategories(mappedCategories);

            // Set default category if not set and categories are loaded
            if (mappedCategories.length > 0) {
                // Always set category if it's empty or not in the new categories list
                const currentCategoryExists = category && mappedCategories.find(cat =>
                    cat.key === category ||
                    cat.id?.toString() === category ||
                    cat.key?.toString() === category?.toString()
                );

                if (!currentCategoryExists) {
                    setCategory(mappedCategories[0].key);
                }
            } else {
                // No categories available
                setCategory('');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            setCategories([]);
        }
    };

    // Categories are hardcoded for now - can be loaded from API later if needed
    // useEffect(() => {
    //     // Load categories from API if needed
    // }, [t]);

    // Load article data when editing
    useEffect(() => {
        if (editingArticle) {
            setTitle(editingArticle.title || '');
            setContent(editingArticle.content || editingArticle.contentPreview || '');
            setArticleId(editingArticle.id);

            // Set category from article categories
            // This will be set after categories are loaded
            // We'll use a separate useEffect to handle this

            // Set image preview if available
            if (editingArticle.featuredImageUrl) {
                setImagePreview(editingArticle.featuredImageUrl);
            }
        } else {
            // Reset form when not editing
            setTitle('');
            setContent('');
            // Set default category from available categories
            if (categories.length > 0) {
                setCategory(categories[0].key || categories[0].id?.toString() || categories[0].id);
            }
            setArticleId(null);
            setSelectedImage(null);
            setImagePreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [editingArticle]);

    // Set category when editing article and categories are loaded
    useEffect(() => {
        if (editingArticle && categories.length > 0) {
            if (editingArticle.categories && Array.isArray(editingArticle.categories) && editingArticle.categories.length > 0) {
                const firstCategory = editingArticle.categories[0];
                const categoryId = firstCategory.id || firstCategory.Id;
                // Find matching category in loaded categories
                const matchingCategory = categories.find(cat =>
                    cat.id === categoryId ||
                    cat.id?.toString() === categoryId?.toString() ||
                    cat.key === categoryId?.toString()
                );
                if (matchingCategory) {
                    setCategory(matchingCategory.key);
                } else if (categoryId) {
                    setCategory(categoryId.toString());
                }
            } else if (editingArticle.categoryIds && Array.isArray(editingArticle.categoryIds) && editingArticle.categoryIds.length > 0) {
                const categoryId = editingArticle.categoryIds[0];
                const matchingCategory = categories.find(cat =>
                    cat.id === categoryId ||
                    cat.id?.toString() === categoryId?.toString() ||
                    cat.key === categoryId?.toString()
                );
                if (matchingCategory) {
                    setCategory(matchingCategory.key);
                } else if (categoryId) {
                    setCategory(categoryId.toString());
                }
            } else if (editingArticle.category) {
                const categoryId = editingArticle.category;
                const matchingCategory = categories.find(cat =>
                    cat.id === categoryId ||
                    cat.id?.toString() === categoryId?.toString() ||
                    cat.key === categoryId?.toString()
                );
                if (matchingCategory) {
                    setCategory(matchingCategory.key);
                } else if (categoryId) {
                    setCategory(categoryId.toString());
                }
            }
        }
    }, [editingArticle, categories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!userId) {
            setMessage(t('articles.create.userError'));
            return;
        }

        if (!title.trim() || !content.trim()) {
            setMessage(t('articles.create.validationError'));
            return;
        }

        setIsPublishing(true);
        setMessage('');

        try {



            // Find the selected category to get its ID
            if (!category) {
                setMessage(t('articles.create.categoryError') || 'يرجى اختيار تصنيف صحيح');
                setIsPublishing(false);
                return;
            }

            const selectedCategory = categories.find(cat =>
                cat.key === category ||
                cat.id?.toString() === category ||
                cat.id === category ||
                cat.key?.toString() === category?.toString()
            );

            if (!selectedCategory) {
                setMessage(t('articles.create.categoryError') || 'يرجى اختيار تصنيف صحيح');
                setIsPublishing(false);
                return;
            }

            // Use category ID from API (should be a number)
            let finalCategoryId = selectedCategory.id;

            // Convert to number if it's not already
            const categoryIdNum = parseInt(finalCategoryId);
            finalCategoryId = !isNaN(categoryIdNum) ? categoryIdNum : finalCategoryId;


            const articleData = {
                title: title.trim(),
                content: content.trim(),
                categoryIds: [finalCategoryId], // Send as array - API expects categoryIds (lowercase)
            };

            if (selectedImage instanceof File) {
                articleData.featuredImage = selectedImage;
            } else if (editingArticle && editingArticle.featuredImage) {
                articleData.featuredImage = editingArticle.featuredImage;
            }


            let response;
            if (articleId) {
                response = await api.updateArticle(articleId, articleData);
            } else {
                response = await api.createArticle(articleData);
            }

            if (response.id) {
                const successMessage = articleId
                    ? t('articles.create.updateSuccess') || 'تم تحديث المقال بنجاح'
                    : t('articles.create.success');
                setMessage(successMessage);


                setTitle('');
                setContent('');
                // Set default category from available categories
                if (categories.length > 0) {
                    setCategory(categories[0].key || categories[0].id?.toString() || categories[0].id);
                }
                setArticleId(null);
                setSelectedImage(null);
                setImagePreview(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }

                if (onArticleCreated) {
                    onArticleCreated();
                }
            } else {
                setMessage(t('articles.create.error'));
            }
        } catch (error) {

            let errorMsg = error.message || t('articles.create.error');

            if (error.data) {
                if (error.data.categoryIds || error.data.CategoryIds) {
                    const categoryError = Array.isArray(error.data.categoryIds || error.data.CategoryIds)
                        ? (error.data.categoryIds || error.data.CategoryIds).join(', ')
                        : (error.data.categoryIds || error.data.CategoryIds);
                    errorMsg = `خطأ في التصنيف: ${categoryError}`;
                } else if (error.data.errors) {
                    const errors = error.data.errors;
                    if (typeof errors === 'object') {
                        const errorMessages = Object.keys(errors).map(key => {
                            const value = errors[key];
                            return Array.isArray(value) ? value.join(', ') : value;
                        });
                        errorMsg = errorMessages.join(' | ');
                    } else {
                        errorMsg = errors;
                    }
                } else if (error.data.message) {
                    errorMsg = error.data.message;
                }
            }

            if (error.status === 404) {
                errorMsg = `خطأ ${error.status}: ${error.message || 'Not Found'}`;
            } else if (error.status === 400) {
                errorMsg = `خطأ في البيانات: ${errorMsg}`;
            } else if (error.status === 403) {
                errorMsg = 'غير مصرح لك بنشر المقالات. يرجى التأكد من تسجيل الدخول كمسؤول.';
            } else if (error.status === 401) {
                errorMsg = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
            }

            setMessage(`${t('articles.create.error')}: ${errorMsg}`);
        } finally {
            setIsPublishing(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = (e) => {
        e.stopPropagation();
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="article-creation">
            <h2 className="article-creation-title">
                {articleId ? (t('articles.create.editTitle') || 'تعديل المقال') : t('articles.create.title')}
            </h2>
            <form onSubmit={handleSubmit} className="article-creation-form">
                <div className="article-form-group article-title-with-category">
                    <div className="article-title-input-wrapper">
                        <label htmlFor="title" className="article-label">
                            {t('articles.create.articleTitle')}
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={t('articles.create.titlePlaceholder')}
                            className="article-input"
                            disabled={isPublishing}
                        />
                    </div>
                    <div className="article-category-dropdown-wrapper">
                        <label htmlFor="category" className="article-label">
                            {t('articles.create.selectCategory')}
                        </label>
                        <select
                            id="category"
                            value={category || (categories.length > 0 ? categories[0].key : '')}
                            onChange={(e) => setCategory(e.target.value)}
                            className="article-category-select"
                            disabled={isPublishing || categories.length === 0}
                        >
                            {categories.length === 0 ? (
                                <option value="">{t('articles.create.loadingCategories') || 'جار تحميل التصنيفات...'}</option>
                            ) : (
                                categories.map((cat) => (
                                    <option key={cat.key} value={cat.key}>
                                        {cat.label}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                <div className="article-form-group">
                    <label htmlFor="content" className="article-label">
                        {t('articles.create.articleContent')}
                    </label>
                    <textarea
                        id="content"
                        rows="8"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={t('articles.create.contentPlaceholder')}
                        className="article-textarea"
                        maxLength={1000}
                        disabled={isPublishing}
                    ></textarea>
                    <div className="article-char-count">
                        {content.length}{t('articles.create.charCount')}
                    </div>
                </div>

                <div className="article-upload-area" onClick={handleImageClick}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        style={{ display: 'none' }}
                        disabled={isPublishing}
                    />
                    {imagePreview ? (
                        <div className="article-image-preview">
                            <img src={imagePreview} alt="Preview" className="article-preview-img" />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="article-remove-image-btn"
                                disabled={isPublishing}
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="article-upload-text">{t('articles.create.attachImage')}</p>
                            <p className="article-upload-hint">{t('articles.create.uploadHint')}</p>
                            <PlusCircle className="article-upload-icon" />
                        </>
                    )}
                </div>

                {message && (
                    <p className={`article-message ${message === t('articles.create.success') ? 'success' : 'error'}`}>
                        {message}
                    </p>
                )}

                <Button
                    type="submit"
                    disabled={isPublishing}
                    loading={isPublishing}
                    icon={Send}
                    loadingIcon={Loader2}
                >
                    {isPublishing ? t('articles.create.publishing') : t('articles.create.publish')}
                </Button>
            </form>
        </div>
    );
};

export default CreateArticle;

