import React from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, itemName, isLoading = false }) => {
    const { t, language } = useTranslation();

    if (!isOpen) return null;

    return (
        <div className="delete-modal-overlay" onClick={onClose}>
            <div className="delete-modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="delete-modal-header">
                    <div className="delete-modal-icon-wrapper">
                        <AlertTriangle className="delete-modal-icon" />
                    </div>
                    <button
                        className="delete-modal-close-btn"
                        onClick={onClose}
                        disabled={isLoading}
                        title={t('common.close') || 'إغلاق'}
                    >
                        <X className="delete-modal-close-icon" />
                    </button>
                </div>

                <div className="delete-modal-content">
                    <h3 className="delete-modal-title">
                        {title || t('common.confirmDelete') || 'تأكيد الحذف'}
                    </h3>
                    <p className="delete-modal-message">
                        {message || (
                            <>
                                {t('common.deleteConfirmMessage') || 'هل أنت متأكد أنك تريد حذف'}
                                {itemName && (
                                    <span className="delete-modal-item-name"> "{itemName}"</span>
                                )}
                                {t('common.questionMark') || '؟'}
                            </>
                        )}
                    </p>
                    <p className="delete-modal-warning">
                        {t('common.deleteWarning') || 'لا يمكن التراجع عن هذا الإجراء.'}
                    </p>
                </div>

                <div className="delete-modal-actions">
                    <button
                        className="delete-modal-cancel-btn"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        {t('common.cancel') || 'إلغاء'}
                    </button>
                    <button
                        className="delete-modal-confirm-btn"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="delete-modal-spinner"></span>
                                {t('common.deleting') || 'جار الحذف...'}
                            </>
                        ) : (
                            <>
                                <Trash2 className="delete-modal-delete-icon" />
                                {t('common.delete') || 'حذف'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;

