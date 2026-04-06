"use client"

import * as React from "react"
import { addDays, format, sub, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerWithRange({
  setFilter,
}: {
  setFilter: (filter: any) => void
}) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  React.useEffect(() => {
    if (date) {
      setFilter((prev: any) => [
        ...prev.filter((f: any) => f.key !== "dateReceived"),
        {
          key: "dateReceived",
          type: "DATE_RANGE",
          value: `${date.from?.toISOString()}_${date.to?.toISOString()}`,
        },
      ])
    }
  }, [date, setFilter])

  return (
    <Field className="mx-auto w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
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
            selected={date}
            onSelect={(selected) => {
              setDate(selected)
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}
