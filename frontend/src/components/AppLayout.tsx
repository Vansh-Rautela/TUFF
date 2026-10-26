import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
  hideSearch?: boolean;
}

export const AppLayout = ({ children, title }: AppLayoutProps) => {
  // A basic layout component. You can expand this with a header, footer, sidebar etc.
  return (
    <div>
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      <main className="p-4">
        {children}
      </main>
    </div>
  );
};
