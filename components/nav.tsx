'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Mail, Users, Send, Settings, TestTube } from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

export function Nav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navigation = [
    { name: t('dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('campaigns'), href: '/campaigns', icon: Mail },
    { name: t('contacts'), href: '/contacts', icon: Users },
    { name: t('followUps'), href: '/followups', icon: Send },
    { name: t('testEmail'), href: '/test-email', icon: TestTube },
    { name: t('settings'), href: '/settings', icon: Settings },
  ]

  return (
    <nav className="flex space-x-4 lg:space-x-6">
      {navigation.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center text-sm font-medium transition-colors hover:text-primary',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
