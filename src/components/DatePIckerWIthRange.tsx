"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

export interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
}

export function DatePickerWithRange({ value, onChange }: DatePickerWithRangeProps) {
  const [internalRange, setInternalRange] = React.useState<DateRange | undefined>(value)
  const [isOpen, setIsOpen] = React.useState(false)
  const [originalRange, setOriginalRange] = React.useState<DateRange | undefined>(value)

  // Guardar el rango original cuando se abre el popover
  const handleOpenChange = (open: boolean) => {
    if (open && value) {
      setOriginalRange(value)
      setInternalRange(value)
    }
    setIsOpen(open)
  }

  // Sincronizar estado interno cuando cambia el valor externo
  React.useEffect(() => {
    setInternalRange(value)
    if (!isOpen) {
      setOriginalRange(value)
    }
  }, [value, isOpen])

  const handleApply = () => {
    onChange?.(internalRange)
    setIsOpen(false)
  }

  const handleClear = () => {
    // Volver al rango original, no limpiar todo
    setInternalRange(originalRange)
    setIsOpen(false)
  }

  const date = value ?? internalRange

  return (
    <Field className="w-60">
      {/* <FieldLabel htmlFor="date-picker-range">Date Picker Range</FieldLabel> */}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className="justify-start px-2.5 font-normal"
          >
            <CalendarIcon />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={internalRange}
            onSelect={setInternalRange}
            numberOfMonths={2}
            disabled={(date) => date > new Date()}
          />
          <div className="flex items-center gap-2 p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleClear}
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApply}
              disabled={!internalRange?.from || !internalRange?.to}
            >
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
