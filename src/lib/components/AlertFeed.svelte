<script lang="ts">
	import { alerts } from '$lib/stores/alerts.svelte';
	import type { SseMessage } from '$lib/types/api';

	interface AlertMeta {
		label: string;
		color: string;
		summary: (data: Record<string, unknown>) => string;
	}

	const ALERT_MAP: Record<string, AlertMeta> = {
		'channel.follow': {
			label: 'Follow',
			color: '#a6e3a1',
			summary: (d) => `${d.user_name ?? d.user_login ?? 'Someone'} followed`
		},
		'channel.subscribe': {
			label: 'Sub',
			color: '#cba6f7',
			summary: (d) =>
				`${d.user_name ?? d.user_login} subscribed (T${d.tier ?? '1'})`
		},
		'channel.subscription.message': {
			label: 'Resub',
			color: '#b4befe',
			summary: (d) =>
				`${d.user_name ?? d.user_login} resubscribed ×${d.cumulative_months ?? '?'}`
		},
		'channel.subscription.gift': {
			label: 'Gift',
			color: '#f5c2e7',
			summary: (d) =>
				`${d.user_name ?? d.user_login ?? 'Anonymous'} gifted ${d.total ?? 1} sub(s)`
		},
		'channel.cheer': {
			label: 'Cheer',
			color: '#f9e2af',
			summary: (d) => `${d.user_name ?? 'Anonymous'} cheered ${d.bits} bits`
		},
		'channel.raid': {
			label: 'Raid',
			color: '#fab387',
			summary: (d) =>
				`${d.from_broadcaster_user_name ?? d.from_broadcaster_user_login} raided with ${d.viewers} viewers`
		},
		'stream.session.started': {
			label: 'Live',
			color: '#a6e3a1',
			summary: (d) => `${d.broadcaster_login ?? 'Stream'} went live`
		},
		'stream.session.ended': {
			label: 'Offline',
			color: '#6c7086',
			summary: () => 'Stream ended'
		},
		'loyalty.points.awarded': {
			label: 'Points',
			color: '#89dceb',
			summary: (d) => `${d.display_name} +${d.amount} pts (${d.reason})`
		},
		'loyalty.reward.redeemed': {
			label: 'Redeem',
			color: '#f38ba8',
			summary: (d) => `${d.display_name} redeemed "${d.reward_name}" (${d.cost} pts)`
		},
		'moderation.action.taken': {
			label: 'Mod',
			color: '#f38ba8',
			summary: (d) => `${d.display_name} → ${d.action} (${d.reason})`
		}
	};

	function getMeta(type: string): AlertMeta {
		return (
			ALERT_MAP[type] ?? {
				label: type.split('.').pop() ?? type,
				color: '#585b70',
				summary: (d) => JSON.stringify(d).slice(0, 80)
			}
		);
	}

	function relativeTime(ts: string): string {
		const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		return `${Math.floor(diff / 3600)}h ago`;
	}
</script>

<div class="alert-feed">
	<div class="feed-header">
		<h2>Live Alerts</h2>
		<span class="dot" class:on={alerts.connected}></span>
	</div>

	{#if alerts.messages.length === 0}
		<p class="empty">Waiting for events…</p>
	{:else}
		<ul>
			{#each alerts.messages as msg (msg.timestamp + msg.type)}
				{@const meta = getMeta(msg.type)}
				<li class="alert-item">
					<span class="badge" style="background:{meta.color};color:#11111b">{meta.label}</span>
					<span class="summary">{meta.summary(msg.data)}</span>
					<span class="time">{relativeTime(msg.timestamp)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.alert-feed {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
		display: flex;
		flex-direction: column;
		min-height: 200px;
		max-height: 500px;
	}

	.feed-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	h2 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #45475a;
		margin-left: auto;
		flex-shrink: 0;
	}

	.dot.on {
		background: #a6e3a1;
		box-shadow: 0 0 4px #a6e3a1;
	}

	ul {
		list-style: none;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.alert-item {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		font-size: 0.825rem;
		padding: 0.3rem 0;
		border-bottom: 1px solid var(--border, #313244);
	}

	.alert-item:last-child {
		border-bottom: none;
	}

	.badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.15rem 0.45rem;
		border-radius: 999px;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.summary {
		flex: 1;
		color: var(--text, #cdd6f4);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.time {
		color: var(--subtext, #a6adc8);
		font-size: 0.7rem;
		flex-shrink: 0;
	}

	.empty {
		color: var(--subtext, #a6adc8);
		font-size: 0.875rem;
		margin: auto;
		text-align: center;
	}
</style>
