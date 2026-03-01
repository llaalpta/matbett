import {
  bookmakerAccountTypeOptions,
  getLabel,
  type BookmakerAccountType,
} from "@matbett/shared";

type BookmakerAccountTypeCarrier = {
  accountType?: BookmakerAccountType | string | null;
  bookmakerAccountType?: BookmakerAccountType | string | null;
};

type BookmakerAccountLike = {
  bookmaker: string;
  accountIdentifier?: string | null;
  bookmakerAccountIdentifier?: string | null;
} & BookmakerAccountTypeCarrier;

type BookmakerAccountWithIdLike = BookmakerAccountTypeCarrier & {
  id: string;
};

function isBookmakerAccountType(
  accountType: string
): accountType is BookmakerAccountType {
  return bookmakerAccountTypeOptions.some((option) => option.value === accountType);
}

export function getBookmakerAccountTypeLabel(
  accountType?: BookmakerAccountType | string | null
) {
  if (!accountType) {
    return "Cuenta";
  }

  return isBookmakerAccountType(accountType)
    ? getLabel(bookmakerAccountTypeOptions, accountType)
    : accountType;
}

export function getBookmakerAccountType(account?: BookmakerAccountTypeCarrier) {
  return account?.accountType ?? account?.bookmakerAccountType;
}

export function buildBookmakerAccountTypeById(
  accounts: readonly BookmakerAccountWithIdLike[]
) {
  return new Map(
    accounts.map((account) => [account.id, getBookmakerAccountType(account)])
  );
}

export function formatBookmakerAccountLabel(account: BookmakerAccountLike) {
  const operatorName = account.bookmaker.trim();
  const identifier = (
    account.accountIdentifier ?? account.bookmakerAccountIdentifier
  )?.trim();

  if (identifier) {
    return `${operatorName} · ${identifier}`;
  }

  return operatorName;
}
