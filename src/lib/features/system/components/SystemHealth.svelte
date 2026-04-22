<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from '$lib/core/api/client';
	import type { PingResponse, SystemStatusResponse, ToolStatus, PluginStatus } from '$lib/types/api';

	// ── State ─────────────────────────────────────────────────────────────────
	let ping = $state<{ ok: boolean; msg: string } | null>(null);
	let tools = $state<ToolStatus[]>([]);
	let plugins = $state<PluginStatus[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let lastChecked = $state<Date | null>(null);

	// ── Load ──────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const [pingRes, statusRes] = await Promise.all([
				get<PingResponse>('/ping'),
				get<SystemStatusResponse>('/system/status')
			]);

			ping = pingRes.success && pingRes.data
				? { ok: pingRes.data.status === 'ok', msg: pingRes.data.message }
				: { ok: false, msg: pingRes.error ?? 'No response' };

			tools = statusRes.success && statusRes.data ? statusRes.data.tools : [];
			plugins = statusRes.success && statusRes.data ? statusRes.data.plugins : [];
			lastChecked = new Date();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			ping = { ok: false, msg: 'Unreachable' };
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Helpers ───────────────────────────────────────────────────────────────
	function statusColor(status: string): string {
		if (status === 'ok' || status === 'healthy' || status === 'running') return '#a6e3a1';
		if (status === 'error' || status === 'failed') return '#f38ba8';
		if (status === 'warning' || status === 'degraded') return '#f9e2af';
		return '#a6adc8';
	}

	function statusDot(status: string): string {
		if (status === 'ok' || status === 'healthy' || status === 'running') return '●';
		if (status === 'error' || status === 'failed') return '●';
		return '●';
	}

	// Group plugins by domain
	let grouped = $derived(
		plugins.reduce<Record<string, PluginStatus[]>>((acc, p) => {
			const key = p.domain ?? 'core';
			if (!acc[key]) acc[key] = [];
			acc[key].push(p);
			return acc;
		}, {})
	);

	let pluginTotal = $derived(plugins.length);
	let pluginHealthy = $derived(plugins.filter((p) => p.status === 'ok' || p.status === 'running').length);
	let toolTotal = $derived(tools.length);
	let toolHealthy = $derived(tools.filter((t) => t.status === 'ok' || t.status === 'healthy').length);

	function formatTime(d: Date): string {
		return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}
</script>

<div class="system-health">
	<!-- Header -->
	<div class="panel-header">
		<h2>System Health</h2>
		<div class="header-right">
			{#if lastChecked}
				<span class="last-checked">Last checked {formatTime(lastChecked)}</span>
			{/if}
			<button class="refresh" onclick={load} disabled={loading}>
				{loading ? '…' : '↺ Refresh'}
			</button>
		</div>
	</div>

	{#if error}
		<p class="err">{error}</p>
	{/if}

	<!-- Summary row -->
	{#if !loading}
		<div class="summary">
			<div class="summary-card" class:healthy={ping?.ok} class:unhealthy={!ping?.ok}>
				<span class="summary-label">API</span>
				<span class="summary-value">{ping?.ok ? 'Online' : 'Offline'}</span>
				<span class="summary-sub">{ping?.msg ?? '—'}</span>
			</div>
			<div class="summary-card" class:healthy={toolHealthy === toolTotal && toolTotal > 0}>
				<span class="summary-label">Tools</span>
				<span class="summary-value">{toolHealthy} / {toolTotal}</span>
				<span class="summary-sub">healthy</span>
			</div>
			<div class="summary-card" class:healthy={pluginHealthy === pluginTotal && pluginTotal > 0}>
				<span class="summary-label">Plugins</span>
				<span class="summary-value">{pluginHealthy} / {pluginTotal}</span>
				<span class="summary-sub">running</span>
			</div>
		</div>
	{/if}

	{#if loading}
		<p class="muted">Checking…</p>
	{:else}
		<!-- Tools -->
		{#if tools.length > 0}
			<section>
				<h3>Tools</h3>
				<div class="item-list">
					{#each tools as tool (tool.name)}
						<div class="item">
							<span class="dot" style="color:{statusColor(tool.status)}">{statusDot(tool.status)}</span>
							<span class="item-name">{tool.name}</span>
							<span class="item-status" style="color:{statusColor(tool.status)}">{tool.status}</span>
							{#if tool.message}
								<span class="item-msg">{tool.message}</span>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Plugins grouped by domain -->
		{#if plugins.length > 0}
			<section>
				<h3>Plugins</h3>
				{#each Object.entries(grouped) as [domain, domainPlugins] (domain)}
					<div class="domain-group">
						<div class="domain-label">{domain}</div>
						<div class="item-list">
							{#each domainPlugins as plugin (plugin.name)}
								<div class="item">
									<span class="dot" style="color:{statusColor(plugin.status)}">{statusDot(plugin.status)}</span>
									<span class="item-name">{plugin.name.replace(/_plugin$/, '')}</span>
									<span class="item-status" style="color:{statusColor(plugin.status)}">{plugin.status}</span>
									{#if plugin.error}
										<span class="item-msg error-msg">{plugin.error}</span>
									{/if}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</section>
		{/if}
	{/if}
</div>

<style>
	.system-health {
		background: var(--surface, #1e1e2e);
		border: 1px solid var(--border, #313244);
		border-radius: 8px;
		padding: 1rem 1.25rem;
	}

	.panel-header {
		display: flex;
		align-items: center;
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

	.header-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.last-checked {
		font-size: 0.72rem;
		color: var(--subtext, #a6adc8);
	}

	.refresh {
		background: none;
		border: 1px solid var(--border, #313244);
		color: var(--subtext, #a6adc8);
		border-radius: 4px;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.refresh:hover:not(:disabled) {
		color: var(--text, #cdd6f4);
		border-color: var(--subtext, #a6adc8);
	}

	.refresh:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Summary cards */
	.summary {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
		flex-wrap: wrap;
	}

	.summary-card {
		flex: 1;
		min-width: 100px;
		background: var(--surface2, #181825);
		border: 1px solid var(--border, #313244);
		border-radius: 6px;
		padding: 0.6rem 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.summary-card.healthy { border-color: rgba(166, 227, 161, 0.3); }
	.summary-card.unhealthy { border-color: rgba(243, 139, 168, 0.3); }

	.summary-label {
		font-size: 0.68rem;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--subtext, #a6adc8);
	}

	.summary-value {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text, #cdd6f4);
	}

	.summary-card.healthy .summary-value { color: #a6e3a1; }
	.summary-card.unhealthy .summary-value { color: #f38ba8; }

	.summary-sub {
		font-size: 0.72rem;
		color: var(--subtext, #a6adc8);
	}

	/* Sections */
	section {
		margin-bottom: 1.25rem;
	}

	h3 {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--subtext, #a6adc8);
		margin-bottom: 0.5rem;
		padding-bottom: 0.3rem;
		border-bottom: 1px solid var(--border, #313244);
	}

	.domain-group {
		margin-bottom: 0.75rem;
	}

	.domain-label {
		font-size: 0.72rem;
		color: var(--accent, #cba6f7);
		font-weight: 600;
		margin-bottom: 0.25rem;
		padding-left: 0.25rem;
	}

	.item-list {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.item {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		font-size: 0.825rem;
		padding: 0.25rem 0.4rem;
		border-radius: 4px;
	}

	.item:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	.dot {
		font-size: 0.55rem;
		flex-shrink: 0;
		line-height: 1.6;
	}

	.item-name {
		flex: 1;
		color: var(--text, #cdd6f4);
		font-family: monospace;
		font-size: 0.8rem;
	}

	.item-status {
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex-shrink: 0;
	}

	.item-msg {
		font-size: 0.72rem;
		color: var(--subtext, #a6adc8);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 220px;
	}

	.error-msg { color: #f38ba8; }

	.muted { color: var(--subtext, #a6adc8); font-size: 0.875rem; }
	.err { color: var(--red, #f38ba8); font-size: 0.875rem; margin-bottom: 0.75rem; }
</style>
