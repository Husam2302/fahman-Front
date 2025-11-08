import React from 'react';
import './Button.css';

const Button = ({
    children,
    type = 'button',
    onClick,
    disabled = false,
    loading = false,
    icon: Icon,
    loadingIcon: LoadingIcon,
    className = '',
    ...props
}) => {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`custom-button ${className}`}
            {...props}
        >
            {loading && LoadingIcon ? (
                <LoadingIcon className="button-icon button-spinner" />
            ) : Icon ? (
                <Icon className="button-icon" />
            ) : null}
            {children && <span>{children}</span>}
        </button>
    );
};

export default Button;

