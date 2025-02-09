import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    SafeMultisigTransactionListResponse,
} from "@safe-global/api-kit";
import { Safe4337CreateTransactionProps } from "@safe-global/relay-kit";

type SafeMultisigTransactionProps = {
    pendingTransactions?: SafeMultisigTransactionListResponse;
    signSafeProposal: (safeTxHash: string) => Promise<void>;
    createSafeProposal: (transactions: Safe4337CreateTransactionProps["transactions"]) => Promise<void>;
    executeSafeProposal: (safeTxHash: string) => Promise<void>;
};

export const SafePendingTransactions: React.FC<SafeMultisigTransactionProps> = ({
    pendingTransactions,
    signSafeProposal,
    // createSafeProposal,
    executeSafeProposal
}) => {

    if (!pendingTransactions?.results?.length) {
        return (
            <Card className="p-4">
                <p className="text-sm text-muted-foreground">No pending transactions</p>
            </Card>
        );
    }

    const handleSign = async (transaction: SafeMultisigTransactionListResponse["results"][0]) => {
        try {
            await signSafeProposal(transaction.safeTxHash);
        } catch (error) {
            console.error("Failed to sign transaction:", error);
        }
    };

    const handleExecute = async (transaction: SafeMultisigTransactionListResponse["results"][0]) => {
        try {
            await executeSafeProposal(transaction.safeTxHash);
        } catch (error) {
            console.error("Failed to execute transaction:", error);
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold">Pending Transactions</h2>
            {pendingTransactions.results.map((tx) => {
                const hasEnoughConfirmations = (tx.confirmations?.length ?? 0) >= tx.confirmationsRequired;

                return (
                    <Card key={tx.safeTxHash} className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">To: {tx.to}</p>
                                <p className="text-sm text-muted-foreground">
                                    Value: {tx.value} ETH
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Confirmations: {tx.confirmations?.length ?? 0} /{" "}
                                    {tx.confirmationsRequired}
                                </p>
                            </div>
                            <div className="space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSign(tx)}
                                    disabled={hasEnoughConfirmations}
                                >
                                    Sign Transaction
                                </Button>
                                {hasEnoughConfirmations && (
                                    <Button
                                        variant="default"
                                        onClick={() => handleExecute(tx)}
                                    >
                                        Execute
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
