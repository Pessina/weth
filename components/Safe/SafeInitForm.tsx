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
import { AlertCircle, Loader2, Users } from "lucide-react"

const safeFormSchema = z.object({
    owners: z.string().min(1, "At least one owner address is required"),
    threshold: z.number().min(1, "Threshold must be at least 1"),
    saltNonce: z.string().min(1, "Salt nonce is required")
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
            saltNonce: "1"
        },
    })

    async function onSubmit(values: z.infer<typeof safeFormSchema>) {
        try {
            const owners = values.owners.split(",").map(addr => addr.trim())
            await initSafe({
                options: {
                    owners,
                    threshold: values.threshold,
                    saltNonce: values.saltNonce
                }
            })
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="space-y-6 pt-4">
            <Alert variant="default" className="border-blue-200 bg-blue-50/50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-600">
                    You need to initialize a Safe account first
                </AlertDescription>
            </Alert>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="owners"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Owner Addresses</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="0x123..., 0x456..."
                                            {...field}
                                            className="font-mono pl-9"
                                        />
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </FormControl>
                                <FormDescription className="text-xs">
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
                                        className="font-mono"
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Number of owners required to confirm transactions
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="saltNonce"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Salt Nonce</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        {...field}
                                        className="font-mono"
                                    />
                                </FormControl>
                                <FormDescription className="text-xs">
                                    Unique identifier for Safe deployment
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
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Initializing...
                            </>
                        ) : (
                            "Initialize Safe"
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    )
}