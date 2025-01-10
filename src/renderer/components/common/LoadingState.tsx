import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium'
}) => {
  const spinnerSize = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`spinner ${spinnerSize} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`} />
      <p className="mt-2 text-gray-600">{message}</p>
    </div>
  );
};
