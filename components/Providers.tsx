"use client";

import '@rainbow-me/rainbowkit/styles.css';
import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    sepolia,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import { useEnv } from '@/hooks/useEnv';
import { useMemo } from 'react';

export const Providers = ({ children }: { children: React.ReactNode }) => {
    const { rainbowAppName, rainbowProjectId } = useEnv();

    const queryClient = new QueryClient();

    const config = useMemo(() => getDefaultConfig({
        appName: rainbowAppName,
        projectId: rainbowProjectId,
        chains: [sepolia],
        ssr: true,
    }), [rainbowAppName, rainbowProjectId]);

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}