"use client"

import { useWETHContract } from "@/contracts/weth/useWETHContract";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Balance } from "@/components/Balance"
import { SafeWETHForm } from "@/components/SafeWETHForm";
import { WalletWETHForm } from "@/components/WalletWETHForm";

export default function Home() {
  const { address } = useAccount();
  const { data: ethBalance, isLoading: isEthBalanceLoading } = useBalance(
    { address }
  )
  const { wethBalance, isWETHBalanceLoading } = useWETHContract();

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
          <CardContent>
            <Tabs defaultValue="direct" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="direct">Direct</TabsTrigger>
                <TabsTrigger value="safe">Safe</TabsTrigger>
              </TabsList>
              <TabsContent value="direct">
                <WalletWETHForm />
              </TabsContent>
              <TabsContent value="safe">
                <SafeWETHForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>}
    </div>
  );
}
