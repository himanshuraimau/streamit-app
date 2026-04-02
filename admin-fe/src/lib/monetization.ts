type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

export const formatCurrencyAmount = (amountInMinorUnits: number, currency = 'INR') =>
  new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountInMinorUnits / 100);

export const formatCoins = (value: number) => new Intl.NumberFormat('en-IN').format(value);

export const formatDateTime = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleString() : '—';

export const formatDateValue = (value?: string | Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

export const toStartOfDayIso = (value: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;

export const toEndOfDayIso = (value: string) =>
  value ? new Date(`${value}T23:59:59.999Z`).toISOString() : undefined;

export const getPurchaseStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'COMPLETED':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    case 'REFUNDED':
      return 'outline';
    default:
      return 'secondary';
  }
};

export const getWithdrawalStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'PAID':
    case 'APPROVED':
      return 'default';
    case 'PENDING':
    case 'UNDER_REVIEW':
    case 'ON_HOLD':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getDiscountStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'MAXED_OUT':
      return 'outline';
    case 'EXPIRED':
      return 'destructive';
    case 'INACTIVE':
    default:
      return 'secondary';
  }
};

export const prettifyGateway = (gateway?: string | null) => {
  if (!gateway) return 'Dodo';

  return gateway
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};
