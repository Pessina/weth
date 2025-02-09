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
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { parseEther } from "viem"
import { ArrowDownUp, Loader2 } from "lucide-react"

const wethFormSchema = z.object({
    amount: z.string().min(1, "Amount is required")
})

interface WETHAmountFormProps {
    isLoading: boolean;
    onWrap: (amount: bigint) => Promise<void>;
    onUnwrap: (amount: bigint) => Promise<void>;
}

export function WETHAmountForm({ isLoading, onWrap, onUnwrap }: WETHAmountFormProps) {
    const form = useForm<z.infer<typeof wethFormSchema>>({
        resolver: zodResolver(wethFormSchema),
        defaultValues: {
            amount: "",
        },
    })

    async function handleWrap(values: z.infer<typeof wethFormSchema>) {
        try {
            await onWrap(parseEther(values.amount));
            form.reset();
        } catch (error) {
            console.error(error);
        }
    }

    async function handleUnwrap(values: z.infer<typeof wethFormSchema>) {
        try {
            await onUnwrap(parseEther(values.amount));
            form.reset();
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Form {...form}>
            <form className="space-y-6">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="0.0"
                                        {...field}
                                        className="font-mono pl-8"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        Ξ
                                    </span>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <Button
                        type="button"
                        disabled={isLoading}
                        onClick={form.handleSubmit(handleWrap)}
                        variant="default"
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Wrapping...
                            </>
                        ) : (
                            <>
                                <ArrowDownUp className="mr-2 h-4 w-4" />
                                Wrap ETH
                            </>
                        )}
                    </Button>
                    <Button
                        type="button"
                        disabled={isLoading}
                        onClick={form.handleSubmit(handleUnwrap)}
                        variant="outline"
                        className="w-full"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Unwrapping...
                            </>
                        ) : (
                            <>
                                <ArrowDownUp className="mr-2 h-4 w-4" />
                                Unwrap WETH
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    )
} 