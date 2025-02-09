"use client"

import { formatEther } from "viem";
import { Skeleton } from "@/components/ui/skeleton";

type BalanceProps = {
    label: string;
    isLoading: boolean;
    balance: bigint;
}

export const Balance: React.FC<BalanceProps> = ({ label, isLoading, balance }) => {
    const formattedBalance = Number(formatEther(balance ?? 0n)).toFixed(6);

    return (
        <div className="flex justify-between items-center py-2 text-xs">
            <span className="font-medium text-muted-foreground">{label}</span>
            <div className="flex items-center gap-2">
                {isLoading ? (
                    <Skeleton className="h-6 w-24" />
                ) : (
                    <span className="font-mono font-medium">
                        {formattedBalance} {label}
                    </span>
                )}
            </div>
        </div>
    );
};

