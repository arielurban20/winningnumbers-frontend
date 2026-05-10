"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import type { State } from "@/types/api"

interface StateSelectorProps {
  states: State[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  label?: string
  placeholder?: string
}

export function StateSelector({
  states,
  selectedSlug,
  onSelect,
  label = "Select State",
  placeholder = "Choose a state...",
}: StateSelectorProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <Select value={selectedSlug || ""} onValueChange={onSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {states.map((state) => (
              <SelectItem key={state.slug} value={state.slug}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
