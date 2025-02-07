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
import { Hex, parseEther } from "viem"

const wethFormSchema = z.object({
    amount: z.string().min(1, "Amount is required")
})

interface WETHAmountFormProps {
    isLoading: boolean;
    onWrap: (amount: bigint) => Promise<Hex>;
    onUnwrap: (amount: bigint) => Promise<Hex>;
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
            <form className="space-y-4">
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>ETH Amount</FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="0.0"
                                    {...field}
                                    className="font-mono"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex gap-4">
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={form.handleSubmit(handleWrap)}
                        variant="default"
                    >
                        {isLoading ? "Processing..." : "Wrap ETH"}
                    </Button>
                    <Button
                        type="button"
                        className="flex-1"
                        disabled={isLoading}
                        onClick={form.handleSubmit(handleUnwrap)}
                        variant="outline"
                    >
                        {isLoading ? "Processing..." : "Unwrap WETH"}
                    </Button>
                </div>
            </form>
        </Form>
    )
} 