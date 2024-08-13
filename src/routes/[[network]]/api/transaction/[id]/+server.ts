import { error, json } from '@sveltejs/kit';

import { getChainDefinitionFromParams, getNetwork } from '$lib/state/network.svelte';
import { getBackendClient } from '$lib/wharf/client/ssr';
import type { API } from '@wharfkit/antelope';
import { getCacheHeaders } from '$lib/utils';

export async function GET({ fetch, params }) {
	const chain = getChainDefinitionFromParams(params.network);
	if (!chain) {
		return json({ error: 'Invalid chain specified' }, { status: 400 });
	}

	const network = getNetwork(chain, fetch);
	if (!network.resources) {
		return json({ error: 'Network resources not initialized' }, { status: 500 });
	}

	let transaction: API.v1.GetTransactionResponse;
	try {
		transaction = await getBackendClient(fetch, network.shortname, true).v1.history.get_transaction(
			params.id
		);
	} catch (e) {
		return error(500, {
			message: `Error while loading account ${params.id}: ${e}.`
		});
	}

	const irreversible = transaction.last_irreversible_block.gte(transaction.block_num);
	const headers = getCacheHeaders(5, irreversible);

	return json(
		{
			ts: new Date(),
			transaction
		},
		{
			headers
		}
	);
}
