<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, del } from '$lib/api/client';
	import type { 
		ListRegularsResponse, 
		RegularEntry, 
		AddRegularResponse, 
		RegularData,
		RemoveRegularResponse
	} from '$lib/types/api';

	let regulars = $state<RegularEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Add form
	let twitchId = $state('');
	let login = $state('');
	let displayName = $state('');
	let adding = $state(false);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<ListRegularsResponse>('/viewers/regulars');
			regulars = res.success && res.data ? res.data : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function addRegular() {
		if (!twitchId || !login || !displayName) return;
		adding = true;
		try {
			const res = await post<AddRegularResponse>('/viewers/regulars', {
				twitch_id: twitchId,
				login,
				display_name: displayName
			});
			if (res.success && res.data) {
				// The response returns RegularData (basic info), but our list uses RegularEntry.
				// We refresh to get the full list with points/dates or just push a dummy entry.
				await load(); 
				twitchId = '';
				login = '';
				displayName = '';
			} else {
				error = res.error ?? 'Failed to add regular';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			adding = false;
		}
	}

	async function removeRegular(id: string) {
		if (!confirm('Remove from regulars?')) return;
		try {
			const res = await del<RemoveRegularResponse>(`/viewers/regulars/${id}`);
			if (res.success) {
				regulars = regulars.filter(r => r.twitch_id !== id);
			} else {
				error = res.error ?? 'Failed to remove regular';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	onMount(load);
</script>

<div class="regulars-manager">
	<div class="panel-header">
		<h2>Regular Viewers</h2>
		<button class="refresh" onclick={load} disabled={loading}>↺</button>
	</div>

	{#if error}
		<p class="err">{error}</p>
	{/if}

	<div class="add-form">
		<input type="text" placeholder="Twitch ID" bind:value={twitchId} />
		<input type="text" placeholder="Login" bind:value={login} />
		<input type="text" placeholder="Name" bind:value={displayName} />
		<button onclick={addRegular} disabled={adding || !twitchId}>
			{adding ? '…' : '+'}
		</button>
	</div>

	{#if loading}
		<p class="muted">Loading…</p>
	{:else if regulars.length === 0}
		<p class="muted">No regulars found.</p>
	{:else}
		<div class="list">
			{#each regulars as reg (reg.twitch_id)}
				<div class="reg-item">
					<div class="reg-info">
						<span class="reg-name">{reg.display_name}</span>
						<span class="reg-sub">{reg.login} ({reg.twitch_id}) • {reg.points} pts</span>
					</div>
					<button class="delete-btn" onclick={() => removeRegular(reg.twitch_id)}>🗑</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.regulars-manager {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		flex: 1;
	}

	.refresh {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		padding: 0.15rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.add-form {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.add-form input {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		color: var(--text, #cdd6f4);
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		font-size: 0.8rem;
		flex: 1;
		min-width: 0;
	}

	.add-form button {
		background: var(--accent, #cba6f7);
		color: #11111b;
		border: none;
		border-radius: 4px;
		width: 2rem;
		font-weight: 700;
		cursor: pointer;
	}

	.list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.reg-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--surface2, #181825);
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		border: 1px solid var(--border, #313244);
	}

	.reg-info {
		display: flex;
		flex-direction: column;
	}

	.reg-name {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
	}

	.reg-sub {
		font-size: 0.7rem;
		color: var(--subtext, #a6adc8);
	}

	.delete-btn {
		background: none;
		border: none;
		color: var(--subtext, #a6adc8);
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0.25rem;
	}

	.delete-btn:hover {
		color: var(--red, #f38ba8);
	}

	.err {
		color: var(--red, #f38ba8);
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}

	.muted {
		color: var(--subtext, #a6adc8);
		font-size: 0.85rem;
	}
</style>
