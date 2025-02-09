import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    SafeMultisigTransactionListResponse,
} from "@safe-global/api-kit";
import { Safe4337CreateTransactionProps } from "@safe-global/relay-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { splitAddress } from "@/lib/utils";

type SafeMultisigTransactionProps = {
    pendingTransactions?: SafeMultisigTransactionListResponse;
    signSafeProposal: (safeTxHash: string) => Promise<void>;
    createSafeProposal: (transactions: Safe4337CreateTransactionProps["transactions"]) => Promise<void>;
    executeSafeProposal: (safeTxHash: string) => Promise<void>;
    isLoading: boolean;
};

export const SafePendingTransactions: React.FC<SafeMultisigTransactionProps> = ({
    pendingTransactions,
    signSafeProposal,
    executeSafeProposal,
    isLoading
}) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-[120px] w-full rounded-lg" />
                <Skeleton className="h-[120px] w-full rounded-lg" />
            </div>
        );
    }

    if (!pendingTransactions?.results.length) {
        return null;
    }

    return (
        <div className="space-y-4">
            {pendingTransactions.results.map((tx) => {
                const hasEnoughConfirmations = (tx.confirmations?.length ?? 0) >= tx.confirmationsRequired;
                const confirmedAddresses = tx.confirmations?.map(c => c.owner) ?? [];

                return (
                    <Card key={tx.safeTxHash} className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <h3 className="font-medium">Transaction Details</h3>
                                    <div className="flex items-center space-x-2 text-sm">
                                        <span className="text-muted-foreground">Hash:</span>
                                        <code className="rounded bg-muted px-2 py-1 font-mono">{splitAddress(tx.safeTxHash)}</code>
                                    </div>
                                    <div className="mt-4 space-y-2">
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Signed by:</span>
                                            {confirmedAddresses.length > 0 ? (
                                                <ul className="mt-1 space-y-1">
                                                    {confirmedAddresses.map(address => (
                                                        <li key={address} className="text-green-600">
                                                            ✓ {splitAddress(address)}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-muted-foreground mt-1">No signatures yet</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                    <div className="text-sm text-muted-foreground text-right">
                                        Confirmations: {tx.confirmations?.length ?? 0}/{tx.confirmationsRequired}
                                    </div>
                                    <div className="flex gap-2">
                                        {!hasEnoughConfirmations && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => signSafeProposal(tx.safeTxHash)}
                                            >
                                                Sign
                                            </Button>
                                        )}
                                        {hasEnoughConfirmations && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => executeSafeProposal(tx.safeTxHash)}
                                            >
                                                Execute
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
};
