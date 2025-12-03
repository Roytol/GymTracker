"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export type Exercise = {
    id: string
    name: string
}

interface ExercisePickerProps {
    exercises: Exercise[] | undefined
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function ExercisePicker({
    exercises,
    value,
    onChange,
    placeholder = "Select exercise..."
}: ExercisePickerProps) {
    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")

    const selectedExercise = exercises?.find((exercise) => exercise.id === value)

    if (isDesktop) {
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedExercise ? selectedExercise.name : placeholder}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 bg-popover" align="start">
                    <ExerciseList
                        exercises={exercises}
                        setOpen={setOpen}
                        setValue={onChange}
                        value={value}
                    />
                </PopoverContent>
            </Popover>
        )
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedExercise ? selectedExercise.name : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </DrawerTrigger>
            <DrawerContent className="bg-background">
                <div className="mt-4 border-t">
                    <ExerciseList
                        exercises={exercises}
                        setOpen={setOpen}
                        setValue={onChange}
                        value={value}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function ExerciseList({
    exercises,
    setOpen,
    setValue,
    value,
}: {
    exercises: Exercise[] | undefined
    setOpen: (open: boolean) => void
    setValue: (value: string) => void
    value: string
}) {
    return (
        <Command className="bg-background">
            <CommandInput placeholder="Search exercises..." />
            <CommandList className="bg-background">
                <CommandEmpty>No exercise found.</CommandEmpty>
                <CommandGroup>
                    {exercises?.map((exercise) => (
                        <CommandItem
                            key={exercise.id}
                            value={exercise.name} // Command uses name for search filtering usually
                            onSelect={() => {
                                setValue(exercise.id)
                                setOpen(false)
                            }}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === exercise.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {exercise.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )
}
