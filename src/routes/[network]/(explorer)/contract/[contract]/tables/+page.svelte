<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import Pageheader from '$lib/components/pageheader.svelte';
	import Stack from '$lib/components/layout/stack.svelte';

	const { data } = $props();
</script>

<Stack>
	<Pageheader
		title={m.contract_tables_page_title()}
		subtitle={m.contract_tables_page_description({
			tables: data.abi.tables.length,
			contract: String(data.contract),
			network: data.network.chain.name
		})}
	/>
	{#each data.abi.tables as table}
		<a href="/{data.network}/contract/{data.contract}/tables/{table.name}">
			{table.name}
		</a>
	{/each}
</Stack>
