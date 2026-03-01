import type { BookmakerAccountListInput } from "@matbett/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc";

export const useBookmakerAccounts = (params?: BookmakerAccountListInput) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bookmakerAccount.list.queryOptions(
      params ?? {
        pageIndex: 0,
        pageSize: 100,
      }
    ),
  });
};

export const useBookmakerAccount = (id: string | undefined) => {
  const trpc = useTRPC();

  return useQuery({
    ...trpc.bookmakerAccount.getById.queryOptions(
      { id: id! },
      { enabled: Boolean(id) }
    ),
  });
};

export const useCreateBookmakerAccount = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.bookmakerAccount.create.mutationOptions({
      onSuccess: (result) => {
        queryClient.invalidateQueries({
          queryKey: trpc.bookmakerAccount.list.queryKey(),
        });
        queryClient.setQueryData(
          trpc.bookmakerAccount.getById.queryKey({ id: result.id }),
          result
        );
      },
    }),
  });
};

export const useUpdateBookmakerAccount = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.bookmakerAccount.update.mutationOptions({
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.bookmakerAccount.list.queryKey(),
        });
        queryClient.setQueryData(
          trpc.bookmakerAccount.getById.queryKey({ id: variables.id }),
          result
        );
      },
    }),
  });
};

export const useDeleteBookmakerAccount = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation({
    ...trpc.bookmakerAccount.delete.mutationOptions({
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({
          queryKey: trpc.bookmakerAccount.list.queryKey(),
        });
        queryClient.removeQueries({
          queryKey: trpc.bookmakerAccount.getById.queryKey({ id: variables.id }),
        });
      },
    }),
  });
};
