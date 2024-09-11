import { Asset, Int64 } from '@wharfkit/antelope';
import type { AccountState } from '$lib/state/client/account.svelte';
import type { NetworkState } from '$lib/state/network.svelte';

export interface UnstakingRecord {
	date: Date | undefined;
	balance: Asset;
	claimable: boolean;
	savings: boolean;
}

const defaultSymbol = Asset.Symbol.from('0,UNKNOWN');
export const defaultQuantity = Asset.fromUnits(0, defaultSymbol);

export function getStakableBalance(network: NetworkState, account: AccountState): Asset {
	let balance = Int64.from(0);
	if (account && account.balance) {
		if (account.balance && account.balance.liquid) {
			balance.add(account.balance.liquid.units);
		}

		// TODO: add rexfund
	}
	return Asset.fromUnits(balance, network.chain.systemToken!.symbol);
}

export function getStakedBalance(network: NetworkState, account: AccountState): Asset {
	let staked = Int64.from(0);
	if (account && account.loaded) {
		if (account.account?.data.rex_info) {
			staked.add(network.rexToToken(account.account.data.rex_info.rex_balance).units);
		}
		if (account.sources.rexfund) {
			staked.add(Asset.from(account.sources.rexfund.balance).units);
		}
	}
	return Asset.fromUnits(staked, network.chain.systemToken!.symbol);
}

export function getClaimableBalance(
	network: NetworkState,
	account: AccountState,
	unstaking: Array<UnstakingRecord> | undefined
): Asset {
	// claimable buckets, rex to be sold
	let claimable = Int64.from(0);

	if (!unstaking) {
		unstaking = getUnstakingBalances(network, account);
	}

	const sum: Int64 = unstaking
		.filter((r) => r.claimable)
		.reduce((acc, r) => acc.adding(r.balance.units), Int64.from(0));
	if (sum) {
		claimable.add(sum);
	}

	return Asset.fromUnits(claimable, network.chain.systemToken!.symbol);
}

export function getWithdrawableBalance(network: NetworkState, account: AccountState): Asset {
	let withdrawable = Int64.from(0);
	if (account && account.loaded && account.sources.rexfund && account.sources.rexfund.balance) {
		withdrawable.add(Asset.from(account.sources.rexfund.balance).units);
	}
	return Asset.fromUnits(withdrawable, network.chain.systemToken!.symbol);
}

export function getUnstakingBalances(
	network: NetworkState,
	account: AccountState
): Array<UnstakingRecord> {
	// matured_rex + claimable buckets
	let records: Array<UnstakingRecord> = [];
	if (account && account.loaded && account.account?.data.rex_info) {
		const rexInfo = account.account.data.rex_info;
		if (rexInfo.matured_rex && rexInfo.matured_rex.gt(Int64.from(0))) {
			// construct matured as one rex bucket
			records.push({
				date: undefined,
				balance: network.rexToToken(
					Asset.fromUnits(rexInfo.matured_rex, rexInfo.rex_balance.symbol)
				),
				claimable: true,
				savings: false
			});
		}

		if (rexInfo.rex_maturities) {
			// transform real rex buckets
			const fiveYearsFromNow = new Date().getTime() + 1000 * 60 * 60 * 24 * 365 * 5;
			const now = new Date();
			for (const maturity of rexInfo.rex_maturities) {
				if (maturity.first && maturity.second) {
					const date = new Date(maturity.first.toString());
					records.push({
						date,
						balance: network.rexToToken(
							Asset.fromUnits(maturity.second, rexInfo.rex_balance.symbol)
						),
						claimable: +date < +now,
						savings: +date > +fiveYearsFromNow
					});
				}
			}
		}
	}
	return records;
}

export function getUnstakableBalance(
	network: NetworkState,
	account: AccountState,
	unstaking: Array<UnstakingRecord> | undefined
): Asset {
	if (!unstaking) {
		unstaking = getUnstakingBalances(network, account);
	}
	const savings = unstaking.find((r) => r.savings);
	return savings ? savings.balance : Asset.from(0, network.chain.systemToken!.symbol);
}

export function getAPY(network: NetworkState): string {
	const annualReward = 31250000;
	const totalStaked = Number(network.rexstate!.total_lendable.value);
	return ((annualReward / totalStaked) * 100).toFixed(2);
}
