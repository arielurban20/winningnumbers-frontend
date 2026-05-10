"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"

interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onApply: () => void
  isLoading?: boolean
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApply,
  isLoading = false,
}: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel>Start Date</FieldLabel>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-40"
          />
        </Field>
      </FieldGroup>

      <FieldGroup>
        <Field>
          <FieldLabel>End Date</FieldLabel>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-40"
          />
        </Field>
      </FieldGroup>

      <Button onClick={onApply} disabled={isLoading}>
        {isLoading ? "Loading..." : "Apply Filter"}
      </Button>
    </div>
  )
}
