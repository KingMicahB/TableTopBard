"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ModelOption {
  value: string
  label: string
}

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
  models: ModelOption[]
  label?: string
  className?: string
}

export function ModelSelector({
  value,
  onChange,
  models,
  label,
  className,
}: ModelSelectorProps) {
  return (
    <div className={className}>
      {label && (
        <Label className="sr-only">{label}</Label>
      )}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px] focus-visible-ring" aria-label={label || "Select model"}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
