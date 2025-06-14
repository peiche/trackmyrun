import React, { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  title, 
  children,
  action
}) => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {action && <div>{action}</div>}
        </div>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageContainer;