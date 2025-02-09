import Link from "next/link";
import { splitAddress } from "@/lib/utils";
import { useWETHContract } from "@/contracts/weth/useWETHContract";
import { Balance } from "@/components/Balance";
import { useCallback } from "react";
import { Button } from "../ui/button";
import { ExternalLink, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// TODO: This can be likely used from useSafe as now it's connected with Zustand
type SafeDetailsProps = {
    ethBalance: bigint;
    safeAddress: string;
    isSafeDeployed: boolean;
    isAddressLoading: boolean;
    isDeploymentStatusLoading: boolean;
    isBalanceLoading: boolean;
    getSafeExplorerLink: (address: string) => string;
    disconnect: () => void;
}

export const SafeDetails: React.FC<SafeDetailsProps> = ({
    ethBalance,
    safeAddress,
    isSafeDeployed,
    isAddressLoading,
    isDeploymentStatusLoading,
    isBalanceLoading,
    getSafeExplorerLink,
    disconnect
}) => {
    const refreshQueries = useCallback(async () => {
        // TODO
    }, []);

    const { wethBalance, isWETHBalanceLoading } = useWETHContract({
        address: safeAddress,
        refreshQueries
    });

    return (
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1 grow">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">Safe Account</h3>
                            {isDeploymentStatusLoading ? (
                                <Skeleton className="h-6 w-24" />
                            ) : !isSafeDeployed && (
                                <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                                    Not Deployed
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 justify-between">
                            {isAddressLoading ? (
                                <Skeleton className="h-6 w-32" />
                            ) : (
                                <Link
                                    href={getSafeExplorerLink(safeAddress)}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-600 font-mono"
                                >
                                    {splitAddress(safeAddress)}
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={disconnect}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                disabled={isAddressLoading || isDeploymentStatusLoading}
                            >
                                <LogOut className="h-4 w-4 mr-2" />
                                Disconnect
                            </Button>
                        </div>
                    </div>
                </div>
                <div>
                    <Balance isLoading={isBalanceLoading} balance={ethBalance} label="ETH" />
                    <Balance isLoading={isWETHBalanceLoading} balance={wethBalance ?? 0n} label="WETH" />
                </div>
            </div>
        </div>
    );
};