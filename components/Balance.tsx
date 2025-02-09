"use client"

import { formatEther } from "viem";

type BalanceProps = {
    label: string;
    isLoading: boolean;
    balance: bigint;
}

export const Balance: React.FC<BalanceProps> = ({ label, isLoading, balance }) => {
    return (
        <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{label}:</span>
            <span>{isLoading ? "Loading..." : `${Number(formatEther(balance ?? 0n)).toFixed(18)} ${label}`}</span>
        </div>
    );
}

