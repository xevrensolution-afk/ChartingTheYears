'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from '@/components/ui/kit/Icon';
import { cn } from '@/lib/utils';

type Item = { label: string; href: string; icon: string };

const overview: Item[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '/icon-svgs/dashboard.svg' },
];

const content: Item[] = [
  { label: 'Books', href: '/admin/books', icon: '/icon-svgs/books.svg' },
  { label: 'Add Book', href: '/admin/books/add', icon: '/icon-svgs/add-book.svg' },
  { label: 'Import Books', href: '/admin/books/import', icon: '/icon-svgs/import.svg' },
  { label: 'Categories', href: '/admin/categories', icon: '/icon-svgs/categories.svg' },
  { label: 'Tags', href: '/admin/tags', icon: '/icon-svgs/tags.svg' },
];

const settings: Item[] = [
  { label: 'Settings', href: '/admin/settings', icon: '/icon-svgs/settings.svg' },
];

function Section({ title, items, current }: { title: string; items: Item[]; current: string }) {
  return (
    <div className="mb-8">
      <p className="px-6 mb-3 text-[11px] font-semibold tracking-[0.18em] text-ink-mute uppercase">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((it) => {
          const active = current === it.href || current.startsWith(it.href + '/');
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  'flex items-center gap-3 px-6 py-2.5 text-[15px] transition-colors',
                  active
                    ? 'text-accent font-semibold'
                    : 'text-ink hover:text-ink-soft',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-lg',
                    active ? 'text-accent' : 'text-ink',
                  )}
                >
                  <img src={it.icon} alt="" width="22" height="22" className={active ? '' : 'opacity-80'} />
                </span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-72 shrink-0 flex-col bg-surface border-r border-line/60 min-h-screen">
      <div className="px-6 py-7 border-b border-line/50">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-sm bg-coffee-2 text-canvas">
            <img src="/icon-svgs/logo-icon.svg" alt="" width="26" height="26" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight text-ink">
              Charting the Years
            </span>
            <span className="block text-sm text-accent">Admin panel</span>
          </span>
        </Link>
      </div>
      <nav className="pt-8">
        <Section title="Overview" items={overview} current={pathname} />
        <Section title="Content" items={content} current={pathname} />
        <Section title="Settings" items={settings} current={pathname} />
      </nav>
    </aside>
  );
}
