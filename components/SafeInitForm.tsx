import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAccount } from "wagmi"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { InitSafeFn } from "@/hooks/useSafe"


const safeFormSchema = z.object({
    owners: z.string().min(1, "At least one owner address is required"),
    threshold: z.number().min(1, "Threshold must be at least 1")
})

interface SafeInitFormProps {
    isLoading: boolean;
    initSafe: InitSafeFn;
}

export function SafeInitForm({ isLoading, initSafe }: SafeInitFormProps) {
    const { address } = useAccount()
    const form = useForm<z.infer<typeof safeFormSchema>>({
        resolver: zodResolver(safeFormSchema),
        defaultValues: {
            owners: address ?? "",
            threshold: 1,
        },
    })

    async function onSubmit(values: z.infer<typeof safeFormSchema>) {
        try {
            const owners = values.owners.split(",").map(addr => addr.trim())
            await initSafe({
                options: {
                    owners,
                    threshold: values.threshold
                }
            })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="space-y-4 pt-4">
            <Alert variant="default">
                <AlertDescription>
                    You need to initialize a Safe account first
                </AlertDescription>
            </Alert>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="owners"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Owner Addresses</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="0x123..., 0x456..."
                                        {...field}
                                        className="font-mono"
                                    />
                                </FormControl>
                                <FormDescription>
                                    Enter comma-separated list of owner addresses
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="threshold"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Required Confirmations</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        min={1}
                                        {...field}
                                        onChange={e => field.onChange(parseInt(e.target.value))}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Number of owners required to confirm transactions
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                        variant="default"
                    >
                        {isLoading ? "Initializing..." : "Initialize Safe"}
                    </Button>
                </form>
            </Form>
        </div>
    )
} 