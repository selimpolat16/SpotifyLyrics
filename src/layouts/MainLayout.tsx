'use client'

import { ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { RootState } from '@/store'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { theme } = useAppSelector((state: RootState) => state.ui)

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      <div className="flex">
        {/* Sidebar buraya gelecek */}
        <div className="flex-1">
          <main className="pb-24">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 