import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, Loader2, Filter, Edit, Heart, Share2, MessageCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api/Api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import CommentsModal from './CommentsModal';
import './article.css';

const ManageArticle = ({ userId, onEditArticle, onCategoriesLoaded }) => {
    const { t, language } = useTranslation();
    const { userRole } = useAuth();
    const [articles, setArticles] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [allCategories, setAllCategories] = useState([]);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, articleId: null, articleTitle: null, isDeleting: false });
    const [commentsModal, setCommentsModal] = useState({ isOpen: false, articleId: null, articleTitle: null });
    const [articleLikes, setArticleLikes] = useState({});
    const [articleLiked, setArticleLiked] = useState({});
    const [isTogglingLike, setIsTogglingLike] = useState({});

    useEffect(() => {
        loadArticles();
        loadAllCategories();
    }, []);

    const loadAllCategories = async () => {
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
                name: language === 'ar'
                    ? (cat.nameAr || cat.NameAr || cat.name || cat.Name || cat.nameEn || cat.NameEn)
                    : (cat.nameEn || cat.NameEn || cat.name || cat.Name || cat.nameAr || cat.NameAr)
            }));

            setAllCategories(mappedCategories);
        } catch (error) {
            console.error('Error loading all categories:', error);
            setAllCategories([]);
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            loadArticles();
        }, 30000);

        return () => clearInterval(interval);
    }, []);



    // Handle like toggle
    const handleToggleLike = async (articleId) => {
        if (isTogglingLike[articleId]) return;

        setIsTogglingLike(prev => ({ ...prev, [articleId]: true }));
        try {
            await api.toggleLike(articleId);

            // Update like count and status
            const [countResponse, checkResponse] = await Promise.all([
                api.getLikeCount(articleId),
                api.checkLike(articleId),
            ]);

            let count = 0;
            if (countResponse && countResponse.success) {
                count = countResponse.data || countResponse.count || 0;
            } else if (typeof countResponse === 'number') {
                count = countResponse;
            } else if (countResponse && countResponse.count !== undefined) {
                count = countResponse.count;
            }

            let liked = false;
            if (checkResponse && checkResponse.success) {
                liked = checkResponse.data || checkResponse.liked || false;
            } else if (typeof checkResponse === 'boolean') {
                liked = checkResponse;
            } else if (checkResponse && checkResponse.liked !== undefined) {
                liked = checkResponse.liked;
            }

            setArticleLikes(prev => ({ ...prev, [articleId]: count }));
            setArticleLiked(prev => ({ ...prev, [articleId]: liked }));
        } catch (error) {
            // Silent fail
        } finally {
            setIsTogglingLike(prev => ({ ...prev, [articleId]: false }));
        }
    };

    // Handle comment button click
    const handleCommentClick = (articleId, articleTitle) => {
        setCommentsModal({
            isOpen: true,
            articleId,
            articleTitle,
        });
    };

    // Handle close comments modal
    const handleCloseCommentsModal = () => {
        setCommentsModal({ isOpen: false, articleId: null, articleTitle: null });
    };

    const loadArticles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getArticles();

            let articlesData = [];
            let pageNumber = 1;

            if (response && response.success) {
                const responseData = response.data || response;

                if (responseData.items && Array.isArray(responseData.items)) {
                    articlesData = responseData.items;
                    pageNumber = responseData.pageNumber || 1;
                } else if (Array.isArray(responseData)) {
                    articlesData = responseData;
                } else if (responseData.data && Array.isArray(responseData.data)) {
                    articlesData = responseData.data;
                }
            } else if (response && response.items && Array.isArray(response.items)) {
                articlesData = response.items;
                pageNumber = response.pageNumber || 1;
            } else if (Array.isArray(response)) {
                articlesData = response;
            }

            // Map API response
            const mappedArticles = articlesData.map(article => {
                let categoryIds = [];
                if (article.categories && Array.isArray(article.categories)) {
                    categoryIds = article.categories.map(cat => cat.id || cat.Id || cat.name || cat.Name);
                } else if (article.CategoryIds && Array.isArray(article.CategoryIds)) {
                    categoryIds = article.CategoryIds;
                } else if (article.categoryIds && Array.isArray(article.categoryIds)) {
                    categoryIds = article.categoryIds;
                } else if (article.category || article.Category || article.categoryId || article.CategoryId) {
                    categoryIds = [article.category || article.Category || article.categoryId || article.CategoryId];
                }

                // Handle author 
                const author = article.author || article.Author || {};
                const authorId = author.id || author.Id || article.authorId || article.AuthorId || '';
                const authorName = author.email || author.Email || author.name || author.Name || article.authorName || article.AuthorName || `${t('app.user')} ${authorId.substring(0, 8)}`;

                return {
                    id: article._id || article.id || article.Id,
                    title: article.title || article.Title || '',
                    content: article.content || article.Content || article.contentPreview || article.ContentPreview || '',
                    contentPreview: article.contentPreview || article.ContentPreview || article.content || article.Content || '',
                    category: categoryIds.length > 0 ? categoryIds[0] : '',
                    categories: article.categories || article.Categories || [],
                    authorId: authorId,
                    authorName: authorName,
                    authorImageUrl: author.imageUrl || author.ImageUrl || null,
                    featuredImageUrl: article.featuredImageUrl || article.FeaturedImageUrl || article.imageUrl || article.ImageUrl || article.image || article.Image || null,
                    publishDate: article.publishDate || article.PublishDate || article.createdAt || article.CreatedAt || article.createdDate || article.CreatedDate,
                    createdAt: article.createdAt || article.CreatedAt || article.createdDate || article.CreatedDate || article.publishDate || article.PublishDate,
                    updatedAt: article.updatedAt || article.UpdatedAt || article.updatedDate || article.UpdatedDate,
                    viewCount: article.viewCount || article.ViewCount || 0,
                    likeCount: article.likeCount || article.LikeCount || 0,
                    commentCount: article.commentCount || article.CommentCount || 0,
                };
            });

            setArticles(mappedArticles);

        } catch (err) {
            console.error('Error loading articles:', err);
            let errorMessage = err.message || t('articles.manage.loadError');
            if (err.status === 404) {
                errorMessage = `خطأ ${err.status}: ${err.message || 'Not Found'}`;
            } else if (err.status === 403) {
                errorMessage = 'غير مصرح لك بالوصول إلى هذه البيانات. يرجى التأكد من تسجيل الدخول كمسؤول.';
            } else if (err.status === 401) {
                errorMessage = 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.';
            }
            setError(errorMessage);
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Get unique categories from articles
    const categories = useMemo(() => {
        const categoryMap = new Map();

        articles.forEach(article => {
            // Handle categories array
            if (article.categories && Array.isArray(article.categories)) {
                article.categories.forEach(cat => {
                    const catId = cat.id || cat.Id;
                    if (catId) {
                        const categoryFromApi = allCategories.find(c => c.id === catId || c.id?.toString() === catId?.toString());
                        const categoryName = categoryFromApi
                            ? categoryFromApi.name
                            : (cat.name || cat.Name || catId);
                        categoryMap.set(catId, categoryName);
                    }
                });
            }
            else if (article.categoryIds && Array.isArray(article.categoryIds)) {
                article.categoryIds.forEach(catId => {
                    if (catId && !categoryMap.has(catId)) {
                        // Find category name from loaded categories
                        const categoryFromApi = allCategories.find(c => c.id === catId || c.id?.toString() === catId?.toString());
                        const categoryName = categoryFromApi
                            ? categoryFromApi.name
                            : catId.toString();
                        categoryMap.set(catId, categoryName);
                    }
                });
            }
            else if (article.category) {
                const catId = article.category;
                if (!categoryMap.has(catId)) {
                    const categoryFromApi = allCategories.find(c => c.id === catId || c.id?.toString() === catId?.toString());
                    const categoryName = categoryFromApi
                        ? categoryFromApi.name
                        : catId.toString();
                    categoryMap.set(catId, categoryName);
                }
            }
        });

        const categoryList = [
            { key: 'all', label: t('articles.manage.allCategories') },
            ...Array.from(categoryMap.entries()).map(([id, name]) => ({
                key: id,
                label: name
            }))
        ];

        if (onCategoriesLoaded) {
            const availableCategories = Array.from(categoryMap.entries()).map(([id, name]) => ({
                id: id,
                name: name,
                key: id.toString()
            }));
            onCategoriesLoaded(availableCategories);
        }

        return categoryList;
    }, [articles, allCategories, t, onCategoriesLoaded, language]);

    // Filter articles based on selected category
    const filteredArticles = useMemo(() => {
        if (selectedCategory === 'all') {
            return articles;
        }
        return articles.filter(article => {
            // Check if article has the selected category in its categoryIds array
            if (article.categoryIds && Array.isArray(article.categoryIds)) {
                return article.categoryIds.some(catId => {
                    const catIdStr = catId.toString().toLowerCase();
                    const selectedStr = selectedCategory.toString().toLowerCase();
                    return catIdStr === selectedStr || catIdStr.includes(selectedStr) || selectedStr.includes(catIdStr);
                });
            }

            const articleCategory = (article.category || '').toString().toLowerCase();
            const selectedCategoryLower = selectedCategory.toString().toLowerCase();
            return articleCategory === selectedCategoryLower ||
                articleCategory.includes(selectedCategoryLower) ||
                selectedCategoryLower.includes(articleCategory);
        });
    }, [articles, selectedCategory]);

    // Check if user can edit/delete article
    const canEditArticle = (article) => {
        if (userRole.includes('Admin')) return true;
        if (userRole.includes('Lawyer') && article.authorId === userId) return true;
        return false;
    };

    const canDeleteArticle = (article) => {
        if (userRole.includes('Admin')) return true;
        if (userRole.includes('Lawyer') && article.authorId === userId) return true;
        return false;
    };

    const handleDeleteClick = (articleId) => {
        const article = articles.find(a => a.id === articleId);
        if (!canDeleteArticle(article)) {
            setError(t('articles.manage.noPermission'));
            return;
        }
        setDeleteModal({
            isOpen: true,
            articleId: articleId,
            articleTitle: article?.title || t('articles.manage.noTitle'),
            isDeleting: false
        });
    };

    const handleDeleteConfirm = async () => {
        const { articleId } = deleteModal;
        if (!articleId) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        setError(null);

        try {
            const response = await api.deleteArticle(articleId);

            if (response == "") {
                // Remove from local state
                setArticles(articles.filter(article => article.id !== articleId));
                setError(null);
                setDeleteModal({ isOpen: false, articleId: null, articleTitle: null, isDeleting: false });
            } else {
                setError(t('articles.manage.deleteError'));
                setDeleteModal(prev => ({ ...prev, isDeleting: false }));
            }
        } catch (error) {
            // Error handled by setError
            const errorMessage = error.message || t('articles.manage.deleteError');
            setError(errorMessage);
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, articleId: null, articleTitle: null, isDeleting: false });
    };

    return (
        <div dir={language === 'ar' ? 'rtl' : 'ltr'} className="article-management">
            <div className="article-management-header">
                <h2 className="article-management-title">
                    {t('articles.manage.title')} ({filteredArticles.length})
                </h2>
                <div className="article-filter-wrapper">
                    <Filter className="article-filter-icon" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="article-filter-select"
                    >
                        {categories.map((cat) => (
                            <option key={cat.key} value={cat.key}>
                                {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {isLoading && (
                <div className="article-loading">
                    <Loader2 className="article-loading-spinner article-spinner" />
                    <p className="article-loading-text">{t('articles.manage.loading')}</p>
                </div>
            )}

            {error && <p className="article-error">{error}</p>}

            <div className="article-grid">
                {filteredArticles.map((article) => (
                    <div key={article.id} className="article-card">
                        <div className="article-card-header">
                            <div className="article-categories-wrapper">
                                {article.categories && Array.isArray(article.categories) && article.categories.length > 0 ? (
                                    article.categories.map((cat, index) => {
                                        const catId = cat.id || cat.Id;
                                        // Find category name from loaded categories
                                        const categoryFromApi = allCategories.find(c => c.id === catId || c.id?.toString() === catId?.toString());
                                        const categoryName = categoryFromApi
                                            ? categoryFromApi.name
                                            : (cat.name || cat.Name || catId);

                                        return (
                                            <span key={index} className="article-category-badge">
                                                {categoryName}
                                            </span>
                                        );
                                    })
                                ) : article.categoryIds && Array.isArray(article.categoryIds) && article.categoryIds.length > 0 ? (
                                    article.categoryIds.map((catId, index) => {
                                        // Find category name from loaded categories
                                        const categoryFromApi = allCategories.find(c => c.id === catId || c.id?.toString() === catId?.toString());
                                        const categoryName = categoryFromApi
                                            ? categoryFromApi.name
                                            : catId.toString();

                                        return (
                                            <span key={index} className="article-category-badge">
                                                {categoryName}
                                            </span>
                                        );
                                    })
                                ) : article.category ? (
                                    (() => {
                                        const catId = article.category;
                                        const categoryFromApi = allCategories.find(c => c.id === catId || c.id?.toString() === catId?.toString());
                                        const categoryName = categoryFromApi
                                            ? categoryFromApi.name
                                            : article.category.toString();

                                        return (
                                            <span className="article-category-badge">
                                                {categoryName}
                                            </span>
                                        );
                                    })()
                                ) : null}
                            </div>
                            <div className="article-card-actions">
                                {canEditArticle(article) && (
                                    <button
                                        onClick={() => onEditArticle && onEditArticle(article)}
                                        className="article-edit-btn"
                                        title={t('articles.manage.editTitle')}
                                    >
                                        <Edit className="article-edit-icon" />
                                    </button>
                                )}
                                {canDeleteArticle(article) && (
                                    <button
                                        onClick={() => handleDeleteClick(article.id)}
                                        className="article-delete-btn"
                                        title={t('articles.manage.deleteTitle')}
                                    >
                                        <Trash2 className="article-delete-icon" />
                                    </button>
                                )}
                            </div>
                        </div>
                        {article.featuredImageUrl && (
                            <div className="article-card-image">
                                <img
                                    src={article.featuredImageUrl}
                                    alt={article.title || 'Article image'}
                                    className="article-image"
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        <div className="article-card-meta">
                            <span className="article-author-name">{article.authorName || t('articles.manage.unknownAuthor')}</span>
                            <span className="article-publish-time">
                                {article.createdAt ? new Date(article.createdAt).toLocaleString('ar-EG', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                }) : t('articles.manage.notAvailable')}
                            </span>
                        </div>
                        <h3 className="article-card-title">{article.title || t('articles.manage.noTitle')}</h3>
                        <p className="article-card-content">{article.content || t('articles.manage.noContent')}</p>
                        <div className="article-card-interactions">
                            <button
                                className={`article-like-btn ${articleLiked[article.id] ? 'liked' : ''}`}
                                title={t('articles.manage.like')}
                                onClick={() => handleToggleLike(article.id)}
                                disabled={isTogglingLike[article.id]}
                            >
                                <Heart className={`article-interaction-icon ${articleLiked[article.id] ? 'liked' : ''}`} />
                                <span>{articleLikes[article.id] !== undefined ? articleLikes[article.id] : (article.likeCount || 0)}</span>
                            </button>
                            <button
                                className="article-comment-btn"
                                title={t('articles.manage.comment')}
                                onClick={() => handleCommentClick(article.id, article.title)}
                            >
                                <MessageCircle className="article-interaction-icon" />
                                <span>{article.commentCount || 0}</span>
                            </button>
                        </div>
                    </div>
                ))}
                {!isLoading && articles.length === 0 && (
                    <p className="article-empty">
                        {t('articles.manage.empty')}
                    </p>
                )}
                {!isLoading && articles.length > 0 && filteredArticles.length === 0 && (
                    <p className="article-empty">
                        {t('articles.manage.filteredEmpty')}
                    </p>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={handleDeleteCancel}
                onConfirm={handleDeleteConfirm}
                title={t('articles.manage.deleteTitle') || 'حذف المقال'}
                message={t('articles.manage.confirmDelete') || 'هل أنت متأكد أنك تريد حذف هذا المقال؟'}
                itemName={deleteModal.articleTitle}
                isLoading={deleteModal.isDeleting}
            />

            <CommentsModal
                isOpen={commentsModal.isOpen}
                onClose={handleCloseCommentsModal}
                articleId={commentsModal.articleId}
                articleTitle={commentsModal.articleTitle}
            />
        </div>
    );
};

export default ManageArticle;


