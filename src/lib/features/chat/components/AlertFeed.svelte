<script lang="ts">
	import { alerts } from '$lib/features/chat';
	import type { SseMessage } from '$lib/types/api';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Bell } from '@lucide/svelte';

	interface AlertMeta {
		label: string;
		colorClass: string;
		summary: (data: Record<string, unknown>) => string;
	}

	const ALERT_MAP: Record<string, AlertMeta> = {
		'channel.follow': {
			label: 'Follow',
			colorClass: 'bg-green-500 hover:bg-green-600 text-white',
			summary: (d) => `${d.user_name ?? d.user_login ?? 'Someone'} followed`
		},
		'channel.subscribe': {
			label: 'Sub',
			colorClass: 'bg-purple-500 hover:bg-purple-600 text-white',
			summary: (d) =>
				`${d.user_name ?? d.user_login} subscribed (T${d.tier ?? '1'})`
		},
		'channel.subscription.message': {
			label: 'Resub',
			colorClass: 'bg-indigo-400 hover:bg-indigo-500 text-white',
			summary: (d) =>
				`${d.user_name ?? d.user_login} resubscribed ×${d.cumulative_months ?? '?'}`
		},
		'channel.subscription.gift': {
			label: 'Gift',
			colorClass: 'bg-pink-400 hover:bg-pink-500 text-white',
			summary: (d) =>
				`${d.user_name ?? d.user_login ?? 'Anonymous'} gifted ${d.total ?? 1} sub(s)`
		},
		'channel.cheer': {
			label: 'Cheer',
			colorClass: 'bg-yellow-400 hover:bg-yellow-500 text-black',
			summary: (d) => `${d.user_name ?? 'Anonymous'} cheered ${d.bits} bits`
		},
		'channel.raid': {
			label: 'Raid',
			colorClass: 'bg-orange-400 hover:bg-orange-500 text-white',
			summary: (d) =>
				`${d.from_broadcaster_user_name ?? d.from_broadcaster_user_login} raided with ${d.viewers} viewers`
		},
		'stream.session.started': {
			label: 'Live',
			colorClass: 'bg-green-500 hover:bg-green-600 text-white',
			summary: (d) => `${d.broadcaster_login ?? 'Stream'} went live`
		},
		'stream.session.ended': {
			label: 'Offline',
			colorClass: 'bg-slate-500 hover:bg-slate-600 text-white',
			summary: () => 'Stream ended'
		},
		'loyalty.points.awarded': {
			label: 'Points',
			colorClass: 'bg-cyan-400 hover:bg-cyan-500 text-black',
			summary: (d) => `${d.display_name} +${d.amount} pts (${d.reason})`
		},
		'loyalty.reward.redeemed': {
			label: 'Redeem',
			colorClass: 'bg-rose-400 hover:bg-rose-500 text-white',
			summary: (d) => `${d.display_name} redeemed "${d.reward_name}" (${d.cost} pts)`
		},
		'moderation.action.taken': {
			label: 'Mod',
			colorClass: 'bg-red-500 hover:bg-red-600 text-white',
			summary: (d) => `${d.display_name} → ${d.action} (${d.reason})`
		}
	};

	function getMeta(type: string): AlertMeta {
		return (
			ALERT_MAP[type] ?? {
				label: type.split('.').pop() ?? type,
				colorClass: 'bg-secondary text-secondary-foreground',
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

<Card class="w-full flex flex-col h-[400px]">
	<CardHeader class="pb-3">
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
				<Bell class="w-4 h-4" /> Live Alerts
			</CardTitle>
			<div class="flex items-center gap-2">
				<span class="relative flex h-3 w-3">
					{#if alerts.connected}
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
					{:else}
						<span class="relative inline-flex rounded-full h-3 w-3 bg-muted-foreground"></span>
					{/if}
				</span>
			</div>
		</div>
	</CardHeader>
	<CardContent class="flex-1 overflow-hidden p-0">
		{#if alerts.messages.length === 0}
			<div class="h-full flex items-center justify-center text-sm text-muted-foreground">
				Waiting for events...
			</div>
		{:else}
			<div class="h-full overflow-y-auto px-6 pb-6 space-y-3">
				{#each alerts.messages as msg (msg.timestamp + msg.type)}
					{@const meta = getMeta(msg.type)}
					<div class="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm">
						<div class="flex items-center gap-3 overflow-hidden">
							<Badge class="{meta.colorClass} border-transparent flex-shrink-0">
								{meta.label}
							</Badge>
							<span class="text-sm truncate font-medium">
								{meta.summary(msg.data)}
							</span>
						</div>
						<span class="text-xs text-muted-foreground whitespace-nowrap pt-0.5">
							{relativeTime(msg.timestamp)}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	</CardContent>
</Card>
