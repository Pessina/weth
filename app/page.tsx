"use client"

import { useWETHContract } from "@/contracts/weth/useWETHContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Hex, formatEther } from "viem";
import { useAccount } from "wagmi";
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

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required")
})

export default function Home() {
  const { address } = useAccount();
  const { balance, deposit, withdraw } = useWETHContract({
    account: address as Hex,
  });

  const depositForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  const withdrawForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  })

  async function onDepositSubmit(values: z.infer<typeof formSchema>) {
    try {
      await deposit(parseFloat(values.amount))
      depositForm.reset()
    } catch (error) {
      console.error(error)
    }
  }

  async function onWithdrawSubmit(values: z.infer<typeof formSchema>) {
    try {
      await withdraw(parseFloat(values.amount))
      withdrawForm.reset()
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className="grid grid-rows-[auto_1fr] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectButton />

      {address && (
        <div className="w-full max-w-md space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>WETH Balance</CardTitle>
              <CardDescription>
                {`${formatEther(balance)} WETH`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Form {...depositForm}>
                <form onSubmit={depositForm.handleSubmit(onDepositSubmit)} className="space-y-4">
                  <FormField
                    control={depositForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Deposit</Button>
                </form>
              </Form>

              <Form {...withdrawForm}>
                <form onSubmit={withdrawForm.handleSubmit(onWithdrawSubmit)} className="space-y-4">
                  <FormField
                    control={withdrawForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Withdraw Amount</FormLabel>
                        <FormControl>
                          <Input placeholder="0.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Withdraw</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
