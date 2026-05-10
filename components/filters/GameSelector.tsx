"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import type { Game, GameFamily } from "@/types/api"

interface GameSelectorProps {
  games?: Game[]
  families?: GameFamily[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  label?: string
  placeholder?: string
  useFamily?: boolean
}

export function GameSelector({
  games,
  families,
  selectedSlug,
  onSelect,
  label = "Select Game",
  placeholder = "Choose a game...",
  useFamily = false,
}: GameSelectorProps) {
  const items = useFamily
    ? families?.map((f) => ({ slug: f.familySlug, name: f.familyName })) || []
    : games?.map((g) => ({ slug: g.slug, name: g.name })) || []

  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <Select value={selectedSlug || ""} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.slug} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
