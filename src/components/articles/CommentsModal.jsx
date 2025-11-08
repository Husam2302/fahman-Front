import React, { useState, useEffect } from 'react';
import { X, Send, Trash2, Loader2 } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api/Api';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import './CommentsModal.css';

const CommentsModal = ({ isOpen, onClose, articleId, articleTitle }) => {
    const { t, language } = useTranslation();
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, commentId: null, commentText: null, isDeleting: false });

    useEffect(() => {
        if (isOpen && articleId) {
            loadComments();
        }
    }, [isOpen, articleId]);

    const loadComments = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.getArticleComments(articleId);

            let commentsData = [];
            if (response && response.success) {
                commentsData = response.data || [];
            } else if (Array.isArray(response)) {
                commentsData = response;
            } else if (response && response.data && Array.isArray(response.data)) {
                commentsData = response.data;
            }

            const mappedComments = commentsData.map(comment => ({
                id: comment._id || comment.id || comment.Id,
                text: comment.content || comment.Content || comment.text || comment.Text || '',
                authorName: comment.authorName || comment.AuthorName || comment.userName || comment.UserName || comment.user?.name || comment.User?.Name || comment.user?.email || comment.User?.Email || t('comments.anonymous'),
                authorEmail: comment.authorEmail || comment.AuthorEmail || comment.userEmail || comment.UserEmail || comment.user?.email || comment.User?.Email || '',
                createdAt: comment.createdAt || comment.CreatedAt || comment.date || comment.Date || new Date().toISOString(),
            }));

            setComments(mappedComments);
        } catch (error) {
            console.error('Error loading comments:', error);
            setError(t('comments.loadError') || 'فشل تحميل التعليقات');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const articleIdNum = typeof articleId === 'string' ? parseInt(articleId) : articleId;

            const commentData = {
                articleId: articleIdNum || articleId,
                content: newComment.trim(),
            };

            const response = await api.createComment(commentData);

            if (response && (response.success === false || (response.status && response.status >= 400))) {
                const errorMessage = response.message || response.error || t('comments.createError') || 'فشل إضافة التعليق';
                setError(errorMessage);
                setIsSubmitting(false);
                return;
            }

            // Clear form and reload comments
            setNewComment('');
            await loadComments();
        } catch (error) {
            console.error('Error creating comment:', error);
            let errorMessage = t('comments.createError') || 'فشل إضافة التعليق';

            if (error.message) {
                errorMessage = error.message;
            } else if (error.response) {
                errorMessage = error.response.message || error.response.error || errorMessage;
            } else if (error.status) {
                if (error.status === 400) {
                    errorMessage = 'بيانات غير صحيحة. يرجى التحقق من التعليق.';
                } else if (error.status === 401) {
                    errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
                } else if (error.status === 403) {
                    errorMessage = 'غير مصرح لك بإضافة تعليق.';
                } else if (error.status === 404) {
                    errorMessage = 'المقال غير موجود.';
                } else {
                    errorMessage = `خطأ ${error.status}: ${error.message || 'فشل إضافة التعليق'}`;
                }
            }

            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (commentId, commentText) => {
        setDeleteModal({
            isOpen: true,
            commentId,
            commentText: commentText || t('comments.thisComment'),
            isDeleting: false,
        });
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal.commentId) return;

        setDeleteModal(prev => ({ ...prev, isDeleting: true }));
        try {
            await api.deleteComment(deleteModal.commentId);
            await loadComments(); // Reload comments
            setDeleteModal({ isOpen: false, commentId: null, commentText: null, isDeleting: false });
        } catch (error) {
            console.error('Error deleting comment:', error);
            setError(t('comments.deleteError') || 'فشل حذف التعليق');
            setDeleteModal(prev => ({ ...prev, isDeleting: false }));
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModal({ isOpen: false, commentId: null, commentText: null, isDeleting: false });
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch (error) {
            return dateString;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="comments-modal-overlay" onClick={onClose}>
            <div className="comments-modal-container" onClick={(e) => e.stopPropagation()} dir={language === 'ar' ? 'rtl' : 'ltr'}>
                <div className="comments-modal-header">
                    <h2 className="comments-modal-title">
                        {t('comments.title') || 'التعليقات'} - {articleTitle || t('articles.manage.noTitle')}
                    </h2>
                    <button
                        className="comments-modal-close-btn"
                        onClick={onClose}
                        title={t('common.close') || 'إغلاق'}
                    >
                        <X className="comments-modal-close-icon" />
                    </button>
                </div>

                <div className="comments-modal-content">
                    {error && (
                        <div className="comments-modal-error">
                            {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="comments-modal-loading">
                            <Loader2 className="comments-modal-spinner" />
                            <span>{t('comments.loading') || 'جار التحميل...'}</span>
                        </div>
                    ) : comments.length === 0 ? (
                        <div className="comments-modal-empty">
                            {t('comments.empty') || 'لا توجد تعليقات بعد'}
                        </div>
                    ) : (
                        <div className="comments-list">
                            {comments.map((comment) => (
                                <div key={comment.id} className="comment-item">
                                    <div className="comment-header">
                                        <div className="comment-author">
                                            <span className="comment-author-name">{comment.authorName}</span>
                                            {comment.authorEmail && (
                                                <span className="comment-author-email">({comment.authorEmail})</span>
                                            )}
                                        </div>
                                        <div className="comment-actions">
                                            <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                            <button
                                                className="comment-delete-btn"
                                                onClick={() => handleDeleteClick(comment.id, comment.text)}
                                                title={t('comments.delete') || 'حذف التعليق'}
                                            >
                                                <Trash2 className="comment-delete-icon" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="comment-text">{comment.text}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <form className="comments-modal-form" onSubmit={handleSubmitComment}>
                    <div className="comments-form-group">
                        <textarea
                            className="comments-form-input"
                            placeholder={t('comments.placeholder') || 'اكتب تعليقك هنا...'}
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                        />
                        <button
                            type="submit"
                            className="comments-form-submit-btn"
                            disabled={!newComment.trim() || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="comments-form-spinner" />
                                    <span>{t('comments.submitting') || 'جار الإرسال...'}</span>
                                </>
                            ) : (
                                <>
                                    <Send className="comments-form-send-icon" />
                                    <span>{t('comments.submit') || 'إرسال'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <DeleteConfirmModal
                    isOpen={deleteModal.isOpen}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    title={t('comments.deleteTitle') || 'حذف التعليق'}
                    message={t('comments.confirmDelete') || 'هل أنت متأكد أنك تريد حذف هذا التعليق؟'}
                    itemName={deleteModal.commentText}
                    isLoading={deleteModal.isDeleting}
                />
            </div>
        </div>
    );
};

export default CommentsModal;

