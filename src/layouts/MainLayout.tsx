'use client'

import { ReactNode } from 'react'
import { useAppSelector } from '@/store/hooks'
import { RootState } from '@/store'
import Sidebar from '@/components/Sidebar'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { theme } = useAppSelector((state: RootState) => state.ui)

  return (
    <div className={`min-h-screen bg-background ${theme}`}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <main className="container mx-auto px-8 py-6 pb-24">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
} 