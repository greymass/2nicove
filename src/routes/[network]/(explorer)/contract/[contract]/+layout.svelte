<script lang="ts">
	import PillGroup from '$lib/components/navigation/pillgroup.svelte';
	import { Contract } from '@wharfkit/contract';
	import { setContext } from 'svelte';

	const { children, data } = $props();

	setContext(
		'contract',
		new Contract({
			abi: data.abi,
			account: String(data.contract),
			client: data.network.client
		})
	);

	const options = $derived.by(() => {
		const account = String(data.contract);
		const network = String(data.network);
		return [
			{ href: `/${network}/contract/${account}`, text: 'Overview' },
			{
				href: `/${network}/contract/${account}/actions`,
				text: `Actions (${data.abi.actions.length})`
			},
			{
				href: `/${network}/contract/${account}/structs`,
				text: `Structs (${data.abi.structs.length})`
			},
			{
				href: `/${network}/contract/${account}/tables`,
				text: `Tables (${data.abi.tables.length})`
			},
			{ href: `/${network}/contract/${account}/abi`, text: 'ABI' }
		];
	});
</script>

<!-- <Stack class="gap-2"> -->
<!-- 	<h1 class="h2 leading-none text-muted">Contract</h1> -->
<!-- 	{#if data.contract} -->
<!-- 		<h2 class="h1 font-bold text-white">{data.contract}</h2> -->
<!-- 	{/if} -->
<!-- </Stack> -->

<PillGroup {options} class="mb-6" />

{@render children()}
