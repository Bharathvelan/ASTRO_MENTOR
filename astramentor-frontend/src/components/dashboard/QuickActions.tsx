'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Upload, Network, Settings } from 'lucide-react';

const actions = [
  {
    title: 'New Session',
    description: 'Start a new AI tutoring session',
    icon: Plus,
    href: '/workspace?new=true',
    color: 'text-electric-purple',
  },
  {
    title: 'Upload Repo',
    description: 'Upload a code repository',
    icon: Upload,
    href: '/workspace',
    color: 'text-teal',
  },
  {
    title: 'View Graph',
    description: 'Explore knowledge graph',
    icon: Network,
    href: '/graph',
    color: 'text-blue-500',
  },
  {
    title: 'Settings',
    description: 'Configure preferences',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-500',
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} href={action.href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer text-center">
                  <div className={`p-3 rounded-full bg-muted ${action.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
