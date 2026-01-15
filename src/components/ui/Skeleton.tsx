import React from 'react';
// import { cn } from '../../lib/utils'; // Unused 
// Checking package.json, clsx and tailwind-merge are installed. I should check if lib/utils exists.

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
    return (
        <div
            className={`animate-pulse rounded-md bg-white/10 ${className}`}
            {...props}
        />
    );
};

export { Skeleton };
