"use client"

import { useWETHContract } from "@/contracts/weth/useWETHContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Balance } from "@/components/Balance"

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required")
})

export default function Home() {
  const { address } = useAccount();
  const { data: ethBalance, isLoading: isEthBalanceLoading } = useBalance(
    { address }
  )
  const { wethBalance, deposit, withdraw, isWETHBalanceLoading, isWriting } = useWETHContract();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await deposit(parseFloat(values.amount))
      form.reset()
    } catch (error) {
      console.error(error)
    }
  }

  async function onWithdraw(values: z.infer<typeof formSchema>) {
    try {
      await withdraw(parseFloat(values.amount))
      form.reset()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="grid grid-rows-[auto_1fr] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectButton />
      {address && <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>WETH Balance</CardTitle>
            <CardDescription className="flex flex-col gap-2">
              <Balance isLoading={isEthBalanceLoading} balance={ethBalance?.value ?? 0n} label="ETH" />
              <Balance isLoading={isWETHBalanceLoading} balance={wethBalance ?? 0n} label="WETH" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form className="space-y-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={isWriting}
                    onClick={form.handleSubmit(onSubmit)}
                  >
                    Deposit
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    disabled={isWriting}
                    onClick={form.handleSubmit(onWithdraw)}
                  >
                    Withdraw
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>}
    </div >
  );
}
