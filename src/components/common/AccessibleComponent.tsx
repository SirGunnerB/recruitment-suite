import React from 'react';
import { useId } from 'react';

interface AccessibleProps {
  label: string;
  description?: string;
  errorMessage?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const AccessibleWrapper: React.FC<AccessibleProps> = ({
  label,
  description,
  errorMessage,
  required = false,
  children,
}) => {
  const id = useId();
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div role="group" aria-labelledby={id}>
      <label
        id={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p
          id={descriptionId}
          className="mt-1 text-sm text-gray-500"
        >
          {description}
        </p>
      )}
      
      {React.cloneElement(React.Children.only(children) as React.ReactElement, {
        'aria-describedby': description ? descriptionId : undefined,
        'aria-errormessage': errorMessage ? errorId : undefined,
        'aria-invalid': errorMessage ? 'true' : undefined,
        'aria-required': required,
      })}
      
      {errorMessage && (
        <p
          id={errorId}
          className="mt-1 text-sm text-red-600"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export const AccessibleTable: React.FC<{
  caption: string;
  children: React.ReactNode;
}> = ({ caption, children }) => {
  return (
    <div className="overflow-x-auto" role="region" aria-label={caption}>
      <table className="min-w-full" role="table">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
};

export const AccessibleDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className="relative bg-white rounded-lg p-4 max-w-lg w-full">
          <h2 id={titleId} className="text-lg font-medium mb-4">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </div>
  );
};
