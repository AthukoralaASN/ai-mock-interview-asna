"use client"

import * as React from "react"
import { Controller, FormProvider, useFormContext } from "react-hook-form"

export const Form = FormProvider

export const FormField = Controller

export const FormItem = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-2">{children}</div>
)

export const FormLabel = ({ children }: { children: React.ReactNode }) => (
    <label className="text-sm font-medium">{children}</label>
)

export const FormControl = ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
)

export const FormDescription = ({ children }: { children: React.ReactNode }) => (
    <p className="text-sm text-muted-foreground">{children}</p>
)

export const FormMessage = () => {
    const { formState } = useFormContext()
    return formState.errors ? (
        <p className="text-sm text-red-500">Invalid field</p>
    ) : null
}