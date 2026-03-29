import React from 'react'
import {FormControl, FormDescription, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Controller, FieldValues} from "react-hook-form";
import {FormFieldProps} from "@radix-ui/react-form";
import {Control} from "node:child_process";

interface FormFieldProps<T extends FieldValues> {
    control: Control<T>;
    name: Path<T>
    label: string;
    placeholder?: string;
    type?: 'text' | 'password' | 'email' | 'file'
}

const FormField = ({ control, name, label, placeholder, type
="text"}: FormFieldProps<T>) => (
    <Controller
        name={name}
        control={control}
        render={({ field }) => (
            <FormItem>
                <FormLabel className="label">{label}</FormLabel>
                <FormControl>
                    <Input
                        className="input"
                        placeholder={placeholder}
                        type={type}
                        {...field}
                    />
                </FormControl>

            </FormItem>
        )}
    />
);
export default FormField