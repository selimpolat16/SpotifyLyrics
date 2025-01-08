'use client'

import { FC, ReactNode } from 'react'

interface MainLayoutProps {
  children: ReactNode
}

const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-card">
          {/* Sidebar içeriği buraya gelecek */}
        </aside>

        {/* Ana içerik */}
        <main className="flex-1 bg-background">
          {children}
        </main>
      </div>

      {/* Player */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t">
        {/* Player içeriği buraya gelecek */}
      </div>
    </div>
  )
}

export default MainLayout 