export type Balance = {
  asset: string;
  free: string;
  locked: string;
};

export type Wallet = {
  accountType: string;
  balances: Balance[];
  uid: number;
};

export let wallet: Wallet | null = null;

export function setWallet(data: Wallet): void {
  wallet = data;
}
