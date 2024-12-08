<script lang="ts">
	import { Stack, MultiCard, Switcher } from '$lib/components/layout';
	import TransactionText from '$lib/components/elements/transaction.svelte';
	import AccountText from '$lib/components/elements/account.svelte';
	import Button from '$lib/components/button/button.svelte';
	import { ArrowLeftRight, ArrowRight, ArrowLeft } from 'lucide-svelte';
	import { DD, DL, DLRow } from '$lib/components/descriptionlist/index.js';
	import { goto } from '$lib/utils';

	let { data } = $props();

	const previousBlockLink = $derived(`/${data.network}/block/${Number(data.height) - 1}`);
	const nextBlockLink = $derived(`/${data.network}/block/${Number(data.height) + 1}`);

	const handleKeydown = (e: KeyboardEvent) => {
		// Don't do anything if search is open
		if (
			document.activeElement?.tagName === 'INPUT' ||
			document.activeElement?.tagName === 'TEXTAREA' ||
			document.activeElement?.getAttribute('contenteditable') === 'true'
		) {
			return;
		}

		if (e.key === 'ArrowRight') {
			goto(nextBlockLink);
		} else if (e.key === 'ArrowLeft') {
			goto(previousBlockLink);
		}
	};
</script>

<svelte:window on:keydown={handleKeydown} />

<MultiCard>
	{#if data.block.transactions}
		{@const transactions = data.block.transactions}
		<Stack id="transactions">
			<h2 class="h3 flex items-center gap-2">
				<ArrowLeftRight class="size-5" />
				{transactions.length}
				{transactions.length === 1 ? 'Transaction' : 'Transactions'}
			</h2>

			{#if transactions.length}
				<table class="table-styles">
					<thead>
						<tr>
							<th>Transaction</th>
							<th class="text-right">Actions</th>
							<th class="text-right">CPU (μs)</th>
							<th class="text-right">NET (Bytes)</th>
						</tr>
					</thead>
					<tbody>
						{#each transactions as transaction}
							{#if transaction}
								{@const txID =
									typeof transaction.trx === 'string' ? transaction.trx : transaction.trx.id}
								<tr>
									<td><TransactionText id={txID} /></td>
									<td class="text-right">{transaction.trx.transaction?.actions.length || 0}</td>
									<td class="text-right">{transaction.cpu_usage_us}</td>
									<td class="text-right">{Number(transaction.net_usage_words) * 8}</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			{:else}
				<p>No transactions</p>
			{/if}
		</Stack>
	{/if}

	<Stack class="gap-4" id="details">
		<h2 class="h3">Block Details</h2>

		<DL>
			<DLRow title={'Block Number'}>
				<DD>
					{data.details.blockNumber}
				</DD>
			</DLRow>
			<DLRow title={'Producer Name'}>
				<DD>
					<AccountText name={data.details.blockProducer} />
				</DD>
			</DLRow>
			<DLRow title={'Total CPU'}>
				<DD>
					{data.details.totalCpu} μs
				</DD>
			</DLRow>
			<DLRow title={'Total NET'}>
				<DD>
					{data.details.totalNet * 8} Bytes
				</DD>
			</DLRow>
			<DLRow title={'Total Actions'}>
				<DD>
					{data.details.totalActions}
				</DD>
			</DLRow>
			<DLRow title={'Block ID'}>
				<DD>
					{data.details.blockId}
				</DD>
			</DLRow>
		</DL>

		<Switcher>
			{#if data.height > 1}
				<Button href={previousBlockLink} variant="secondary">
					<span class="inline-flex items-center gap-1">
						<ArrowLeft class="size-4" /> Previous Block
					</span>
				</Button>
			{/if}
			<Button href={nextBlockLink} variant="secondary">
				<span class="inline-flex items-center gap-1">
					Next Block <ArrowRight class="size-4" />
				</span>
			</Button>
		</Switcher>
	</Stack>
</MultiCard>
