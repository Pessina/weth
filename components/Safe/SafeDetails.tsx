import Link from "next/link";
import { splitAddress } from "@/lib/utils";
import { useWETHContract } from "@/contracts/weth/useWETHContract";
import { Balance } from "@/components/Balance";
import { useCallback } from "react";

type SafeDetailsProps = {
    ethBalance: bigint;
    safeAddress: string;
    isSafeDeployed: boolean;
    getSafeExplorerLink: (address: string) => string;
}

export const SafeDetails: React.FC<SafeDetailsProps> = ({ ethBalance, safeAddress, isSafeDeployed, getSafeExplorerLink }) => {
    const refreshQueries = useCallback(async () => {
        // No ETH balance to refresh for Safe
    }, []);

    const { wethBalance, isWETHBalanceLoading } = useWETHContract({
        address: safeAddress,
        refreshQueries
    });

    return (
        <div className="space-y-2">
            <div className="text-sm">
                Safe Account:{" "}
                <Link
                    href={getSafeExplorerLink(safeAddress)}
                    target="_blank"
                    className="text-blue-500 hover:underline"
                >
                    {splitAddress(safeAddress)}
                </Link>
                {!isSafeDeployed && " (not deployed)"}
            </div>
            {/* TODO: update this to user the isLoading prop */}
            <Balance isLoading={false} balance={ethBalance} label="ETH" />
            <Balance isLoading={isWETHBalanceLoading} balance={wethBalance ?? 0n} label="WETH" />
        </div>
    );
}