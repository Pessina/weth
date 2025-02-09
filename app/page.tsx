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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="flex flex-col items-center gap-8">
          <div className="w-full max-w-md">
            <div className="flex justify-end">
              <ConnectButton />
            </div>
          </div>

          {address && (
            <div className="w-full max-w-md">
              <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 border-gray-200/50">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl font-bold text-center">ETH ↔ WETH</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="wallet" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
