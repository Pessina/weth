import { useToast } from "./use-toast";

export const useWithError = () => {
    const { toast } = useToast();

    const withError = async <T,>(
        fn: () => Promise<T>,
        options?: {
            successMessage?: string;
            errorMessage?: string;
        }
    ): Promise<T> => {
        try {
            const result = await fn();

            if (options?.successMessage) {
                toast({
                    title: "Success",
                    description: options.successMessage,
                });
            }

            return result;
        } catch (error) {
            console.error("Operation failed with error:", error);

            toast({
                title: "Error",
                description: options?.errorMessage || "Operation failed",
                variant: "destructive",
            });

            throw error;
        }
    };

    return { withError };
};
