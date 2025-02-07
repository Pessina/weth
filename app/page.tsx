"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SafeWETHForm } from "@/components/Safe";
import { WalletWETHForm } from "@/components/WalletWETHForm";

export default function Home() {
  const { address } = useAccount();

  return (
    <div className="grid grid-rows-[auto_1fr] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <ConnectButton />
      {address && <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>ETH to WETH</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="wallet" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="wallet">Wallet</TabsTrigger>
                <TabsTrigger value="safe">Safe</TabsTrigger>
              </TabsList>
              <TabsContent value="wallet">
                <WalletWETHForm />
              </TabsContent>
              <TabsContent value="safe">
                <SafeWETHForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>}
    </div >
  );
}
