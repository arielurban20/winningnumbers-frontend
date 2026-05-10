"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { SessionTabData } from "@/types/lottery"

interface SessionTabsProps {
  sessions: SessionTabData[]
  activeSession: string
  onSessionChange: (sessionId: string) => void
}

export function SessionTabs({
  sessions,
  activeSession,
  onSessionChange,
}: SessionTabsProps) {
  if (sessions.length <= 1) return null

  return (
    <Tabs value={activeSession} onValueChange={onSessionChange}>
      <TabsList>
        <TabsTrigger value="all">All Sessions</TabsTrigger>
        {sessions.map((session) => (
          <TabsTrigger key={session.id} value={session.id}>
            {session.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
