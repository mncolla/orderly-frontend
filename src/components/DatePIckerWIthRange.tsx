"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { useTranslation } from "react-i18next"

export interface DatePickerWithRangeProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
}

export function DatePickerWithRange({ value, onChange }: DatePickerWithRangeProps) {
  const { t } = useTranslation()
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
  const hasDate = date?.from

  return (
    <div className="w-auto">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant={hasDate ? "default" : "outline"}
            id="date-picker-range"
            className={`
              justify-start px-3 py-2 font-normal transition-all duration-200
              ${hasDate
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 border-blue-600'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              }
            `}
          >
            <CalendarIcon className={hasDate ? "text-white" : "text-gray-600 dark:text-gray-400"} />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "MMM dd, y")} -{" "}
                  {format(date.to, "MMM dd, y")}
                </>
              ) : (
                format(date.from, "MMM dd, y")
              )
            ) : (
              <span className="text-gray-600 dark:text-gray-400">{t('datePicker.selectDateRange')}</span>
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
              {t('datePicker.clear')}
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApply}
              disabled={!internalRange?.from || !internalRange?.to}
            >
              {t('datePicker.apply')}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
