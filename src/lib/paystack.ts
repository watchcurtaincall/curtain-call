// Paystack integration utilities

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxx';

export interface Bank {
  name: string;
  code: string;
  slug: string;
}

export interface ResolvedAccount {
  account_name: string;
  account_number: string;
}

// Fetch Nigerian banks from Paystack (via our API route)
export async function getBanks(): Promise<Bank[]> {
  try {
    const res = await fetch('/api/paystack/banks');
    if (!res.ok) throw new Error('Failed to fetch banks');
    const data = await res.json();
    return data.banks;
  } catch {
    // Fallback list if API fails
    return FALLBACK_BANKS;
  }
}

// Resolve account number (via our secure API route)
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<ResolvedAccount> {
  const res = await fetch('/api/paystack/resolve-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
  });
  if (!res.ok) throw new Error('Could not resolve account');
  const data = await res.json();
  return data;
}

// Initiate Paystack inline popup
export function openPaystackCheckout({
  email,
  amount, // in kobo (multiply NGN by 100)
  metadata,
  onSuccess,
  onClose,
}: {
  email: string;
  amount: number;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}) {
  // @ts-expect-error PaystackPop is injected by the CDN script
  if (typeof window === 'undefined' || !window.PaystackPop) {
    alert('Paystack is not loaded yet. Please refresh and try again.');
    return;
  }

  // @ts-expect-error PaystackPop is injected by the CDN script
  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email,
    amount,
    currency: 'NGN',
    metadata,
    callback: (response: { reference: string }) => {
      onSuccess(response.reference);
    },
    onClose,
  });
  handler.openIframe();
}

// Fallback static bank list if API is unavailable
export const FALLBACK_BANKS: Bank[] = [
  { name: 'Access Bank', code: '044', slug: 'access-bank' },
  { name: 'Citibank Nigeria', code: '023', slug: 'citibank-nigeria' },
  { name: 'Diamond Bank', code: '063', slug: 'diamond-bank' },
  { name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
  { name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
  { name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
  { name: 'First City Monument Bank', code: '214', slug: 'first-city-monument-bank' },
  { name: 'Guaranty Trust Bank', code: '058', slug: 'guaranty-trust-bank' },
  { name: 'Heritage Bank', code: '030', slug: 'heritage-bank' },
  { name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
  { name: 'Kuda Bank', code: '50211', slug: 'kuda-bank' },
  { name: 'Opay', code: '100004', slug: 'opay' },
  { name: 'Palmpay', code: '999991', slug: 'palmpay' },
  { name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
  { name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
  { name: 'Standard Chartered Bank', code: '068', slug: 'standard-chartered-bank' },
  { name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
  { name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
  { name: 'United Bank For Africa', code: '033', slug: 'united-bank-for-africa' },
  { name: 'Unity Bank', code: '215', slug: 'unity-bank' },
  { name: 'VFD Microfinance Bank', code: '566', slug: 'vfd-microfinance-bank' },
  { name: 'Wema Bank', code: '035', slug: 'wema-bank' },
  { name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
];
