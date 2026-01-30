'use client'

import { Nav } from './nav'
import { ThemeToggle } from './theme-toggle'
import { LanguageToggle } from './language-toggle'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useLanguage } from '@/contexts/language-context'

export function Header() {
  const { data: session } = useSession()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <span className="font-bold text-xl">Outreach System</span>
          </a>
          <Nav />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {session && (
            <span className="text-sm text-muted-foreground mr-2">
              {session.user?.name}
            </span>
          )}
          <LanguageToggle />
          <ThemeToggle />
          {session && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
