import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingProps {
  type?: 'spinner' | 'skeleton' | 'dots';
  className?: string;
  children?: React.ReactNode;
}

export const Loading: React.FC<LoadingProps> = ({ type = 'spinner', className, children }) => {
  if (type === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (type === 'dots') {
    return (
      <div className={cn('flex items-center justify-center space-x-2', className)}>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
      </div>
    );
  }

  return (
    <div className={cn('animate-pulse', className)}>
      {children}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn('bg-gray-200 rounded-md', className)}></div>
  );
}; 