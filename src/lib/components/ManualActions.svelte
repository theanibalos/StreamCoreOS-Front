<script lang="ts">
	import { post } from '$lib/api/client';
	import type { BanResponse, TimeoutResponse, UnbanResponse } from '$lib/types/api';

	type ActionType = 'ban' | 'timeout' | 'unban';

	let activeTab = $state<ActionType>('timeout');
	let twitchId = $state('');
	let reason = $state('');
	let duration = $state(600);
	let submitting = $state(false);
	let result = $state<{ ok: boolean; msg: string } | null>(null);

	async function submit() {
		const id = twitchId.trim();
		if (!id) return;
		submitting = true;
		result = null;
		try {
			if (activeTab === 'ban') {
				const res = await post<BanResponse>('/moderation/ban', {
					twitch_id: id,
					reason: reason.trim() || undefined
				});
				result = { ok: res.success, msg: res.success ? `${id} banned.` : (res.error ?? 'Failed.') };
			} else if (activeTab === 'timeout') {
				const res = await post<TimeoutResponse>('/moderation/timeout', {
					twitch_id: id,
					duration_s: duration,
					reason: reason.trim() || undefined
				});
				result = {
					ok: res.success,
					msg: res.success ? `${id} timed out for ${duration}s.` : (res.error ?? 'Failed.')
				};
			} else {
				const res = await post<UnbanResponse>('/moderation/unban', { twitch_id: id });
				result = { ok: res.success, msg: res.success ? `${id} unbanned.` : (res.error ?? 'Failed.') };
			}
			if (result.ok) {
				twitchId = '';
				reason = '';
			}
		} catch (e) {
			result = { ok: false, msg: e instanceof Error ? e.message : String(e) };
		} finally {
			submitting = false;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submit();
	}

	const TAB_LABELS: Record<ActionType, string> = {
		timeout: '⏱ Timeout',
		ban: '🚫 Ban',
		unban: '✅ Unban'
	};
</script>

<div class="manual-actions">
	<div class="panel-header">
		<h2>Manual Actions</h2>
	</div>

	<!-- Tabs -->
	<div class="tabs" role="tablist">
		{#each Object.entries(TAB_LABELS) as [key, label] (key)}
			<button
				role="tab"
				class="tab"
				class:active={activeTab === key}
				onclick={() => {
					activeTab = key as ActionType;
					result = null;
				}}
			>
				{label}
			</button>
		{/each}
	</div>

	<div class="form">
		<label>
			Twitch Username
			<input
				type="text"
				placeholder="Username"
				bind:value={twitchId}
				onkeydown={onKeydown}
			/>
		</label>

		{#if activeTab !== 'unban'}
			<label>
				Reason <span class="hint">(optional)</span>
				<input type="text" placeholder="Rule violation…" bind:value={reason} onkeydown={onKeydown} />
			</label>
		{/if}

		{#if activeTab === 'timeout'}
			<label>
				Duration (s)
				<input type="number" min="1" max="1209600" bind:value={duration} />
			</label>
		{/if}
		<button
			class="action-btn"
			class:danger={activeTab === 'ban'}
			class:warn={activeTab === 'timeout'}
			class:ok={activeTab === 'unban'}
			onclick={submit}
			disabled={submitting || !twitchId.trim()}
		>
			{submitting ? '…' : TAB_LABELS[activeTab]}
		</button>
	</div>

	{#if result}
		<p class="feedback" class:success={result.ok} class:failure={!result.ok}>
			{result.msg}
		</p>
	{/if}
</div>

<style>
	.manual-actions {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header { margin-bottom: 0.75rem; }

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--border, #313244);
		padding-bottom: 0.5rem;
	}

	.tab {
		background: none;
		border: 1px solid transparent;
		border-radius: 4px;
		color: var(--subtext, #a6adc8);
		font-size: 0.8rem;
		font-weight: 500;
		padding: 0.3rem 0.7rem;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s;
	}

	.tab:hover { color: var(--text, #cdd6f4); }

	.tab.active {
		color: var(--accent, #cba6f7);
		border-color: var(--accent, #cba6f7);
		background: rgba(203, 166, 247, 0.08);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.72rem;
		color: var(--subtext, #a6adc8);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.hint { font-size: 0.65rem; text-transform: none; color: #585b70; }

	input[type='text'],
	input[type='number'] {
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 4px;
		color: var(--text, #cdd6f4);
		padding: 0.4rem 0.6rem;
		font-size: 0.875rem;
		outline: none;
		width: 100%;
	}

	input:focus { border-color: var(--accent, #cba6f7); }
	input[type='number'] { width: 8rem; }

	.action-btn {
		align-self: flex-start;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 1rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: 0.25rem;
		background: #45475a;
		color: #cdd6f4;
	}

	.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	.action-btn.danger { background: #f38ba8; color: #11111b; }
	.action-btn.warn { background: #f9e2af; color: #11111b; }
	.action-btn.ok { background: #a6e3a1; color: #11111b; }

	.feedback {
		margin-top: 0.75rem;
		font-size: 0.875rem;
		padding: 0.4rem 0.75rem;
		border-radius: 4px;
	}

	.feedback.success { background: rgba(166, 227, 161, 0.12); color: #a6e3a1; }
	.feedback.failure { background: rgba(243, 139, 168, 0.12); color: #f38ba8; }
</style>
