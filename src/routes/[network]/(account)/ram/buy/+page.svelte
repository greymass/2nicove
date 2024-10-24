<script lang="ts">
	import { getContext } from 'svelte';
	import { Checksum256 } from '@wharfkit/antelope';

	import { getSetting } from '$lib/state/settings.svelte.js';
	import type { UnicoveContext } from '$lib/state/client.svelte';

	import SummaryBuyRAMBytes from '$lib/components/summary/eosio/buyrambytes.svelte';
	import SummaryBuyRAM from '$lib/components/summary/eosio/buyram.svelte';

	import Button from '$lib/components/button/button.svelte';
	import Code from '$lib/components/code.svelte';
	import Label from '$lib/components/input/label.svelte';
	import Stack from '$lib/components/layout/stack.svelte';
	import Transaction from '$lib/components/transaction.svelte';
	import AssetInput from '$lib/components/input/asset.svelte';
	import BytesInput from '$lib/components/input/bytes.svelte';
	import Card from '$lib/components/layout/box/card.svelte';

	import { BuyRAMState } from './state.svelte';
	import { preventDefault } from '$lib/utils';

	let assetInput: AssetInput | undefined = $state();
	let bytesInput: BytesInput | undefined = $state();

	const context = getContext<UnicoveContext>('state');
	const { data } = $props();
	const debugMode = getSetting('debug-mode', true);

	let buyRamState: BuyRAMState = $state(new BuyRAMState(data.network.chain));

	let transactionId: Checksum256 | undefined = $state();

	async function handleBuyRAM() {
		if (!context.wharf || !context.wharf.session) {
			alert('Not logged in');
			return;
		}

		try {
			const transactionResult = await context.wharf.transact({
				action: data.network.contracts.system.action(
					buyRamState.format === 'asset' ? 'buyram' : 'buyrambytes',
					buyRamState.toJSON()
				)
			});

			transactionId = transactionResult.resolved?.transaction.id;

			resetState();
		} catch (error) {
			console.error(error);
		}
	}

	function resetState() {
		buyRamState.reset();
		bytesInput?.reset();
		assetInput?.reset();
	}

	$effect(() => {
		if (context.account) {
			if (context.account.name) {
				buyRamState.payer = context.account.name;
				buyRamState.receiver = context.account.name;
			}

			if (context.account.balance) {
				buyRamState.balance = context.account.balance?.liquid;
			}
		}
	});

	$effect(() => {
		if (data.network.ramprice) {
			buyRamState.pricePerKB = data.network.ramprice.eos;
		}
	});

	function setAssetAmount() {
		buyRamState.format = 'asset';
		buyRamState.bytes = buyRamState.expectedBytes;
	}

	function setBytesAmount() {
		buyRamState.format = 'bytes';
		buyRamState.tokens = buyRamState.bytesValue;
		assetInput?.set(buyRamState.bytesValue);
	}
</script>

{#if transactionId}
	<Transaction network={data.network} {transactionId} />
{/if}

<form onsubmit={preventDefault(handleBuyRAM)}>
	<Stack class="gap-3">
		<Label for="bytesInput">Amount to buy</Label>
		<div class="flex gap-4">
			<div class="flex-1">
				<AssetInput
					bind:value={buyRamState.tokens}
					bind:this={assetInput}
					oninput={setAssetAmount}
					autofocus
				/>
			</div>
			<div class="flex-1">
				<BytesInput
					bind:value={buyRamState.bytes}
					bind:this={bytesInput}
					oninput={setBytesAmount}
				/>
			</div>
		</div>
		{#if buyRamState.insufficientBalance}
			<p class="text-red-500">Insufficient balance. Please enter a smaller amount.</p>
		{/if}
		<p>
			Balance available:
			{#if context.account}
				{context.account.balance?.liquid}
			{:else}
				0.0000 {data.network.chain.systemToken?.symbol.code || ''}
			{/if}
		</p>
	</Stack>

	<Stack class="mt-4 gap-3">
		<Card>
			<h3 class="h3">Details</h3>
			<div class="grid grid-cols-2 gap-2">
				<span>RAM Price:</span>
				<span>{buyRamState.pricePerKB} / KB</span>
				<span>Price for {buyRamState.kbs}:</span>
				<span>{buyRamState.bytesValue}</span>
				<span>Network Fee (0.5%)</span>
				<span>{buyRamState.fee}</span>
				<span>Total Cost</span>
				<span>{buyRamState.bytesCost}</span>
			</div>
		</Card>

		{#if buyRamState.valid}
			{#if buyRamState.format === 'asset'}
				<SummaryBuyRAM action={{ data: buyRamState.toJSON() }} />
			{:else}
				<SummaryBuyRAMBytes action={{ data: buyRamState.toJSON() }} />
			{/if}
		{/if}
	</Stack>

	<Button type="submit" class="mt-4 w-full" disabled={!buyRamState.valid}>Confirm Buy RAM</Button>

	{#if debugMode.value}
		<h3 class="h3">Debugging</h3>
		<Code
			>{JSON.stringify(
				{
					payer: buyRamState.payer,
					receiver: buyRamState.receiver,
					bytes: buyRamState.bytes,
					balance: buyRamState.balance,
					chain: buyRamState.chain,
					pricePerKB: buyRamState.pricePerKB,
					pricePerByte: buyRamState.pricePerByte,
					bytesValue: buyRamState.bytesValue,
					valid: buyRamState.valid,
					insufficientBalance: buyRamState.insufficientBalance,
					balances: context.account?.balances
				},
				undefined,
				2
			)}</Code
		>
	{/if}
</form>
