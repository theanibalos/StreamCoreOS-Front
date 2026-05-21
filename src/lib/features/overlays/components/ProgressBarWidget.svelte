<script lang="ts">
	import type { OverlayElement } from '../types';

	let {
		element,
		statValues = {}
	}: {
		element: OverlayElement;
		statValues: Record<string, string>;
	} = $props();

	const cfg = $derived(element.config ?? {});
	const label       = $derived(cfg.label ?? '');
	const target      = $derived(Number(cfg.target) || 100);
	const showCount   = $derived(cfg.show_count !== false);
	const showPct     = $derived(cfg.show_percentage ?? false);
	const accent      = $derived(element.style.accent ?? '#9147ff');
	const textColor   = $derived(element.style.text_color ?? '#ffffff');
	const bgColor     = $derived(element.style.background ?? '#18181bcc');
	const radius      = $derived(element.style.border_radius ?? 14);
	const fontSize    = $derived(element.style.font_size ?? 20);
	const glow        = $derived(element.style.glow ?? true);
	const opacity     = $derived((element.style.opacity ?? 100) / 100);

	const current = $derived(Math.max(0, parseFloat(statValues[element.id] ?? '0') || 0));
	const percentage = $derived(Math.min(100, (current / target) * 100));
	const completed  = $derived(percentage >= 100);

	// Slightly lighter shade for gradient end
	function lighten(hex: string): string {
		const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
		const r = Math.min(255, ((n >> 16) & 0xff) + 60);
		const g = Math.min(255, ((n >> 8)  & 0xff) + 30);
		const b = Math.min(255, (n & 0xff) + 80);
		return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
	}
</script>

<div
	class="pb-root"
	style="
		background: {bgColor};
		border-radius: {radius}px;
		border: 1.5px solid {accent}44;
		box-shadow: {glow ? `0 0 24px ${accent}44` : 'none'};
		color: {textColor};
		font-size: {fontSize}px;
		padding: 12px 16px;
		gap: 8px;
		opacity: {opacity};
	"
>
	<!-- Header row -->
	<div class="pb-header">
		<span class="pb-label">{label}</span>
		{#if showCount}
			<span class="pb-count">
				{Math.round(current).toLocaleString()} / {target.toLocaleString()}
			</span>
		{/if}
	</div>

	<!-- Track -->
	<div class="pb-track">
		<div
			class="pb-fill"
			style="
				width: {percentage}%;
				background: linear-gradient(90deg, {accent}, {lighten(accent)});
				border-radius: {radius}px;
			"
		>
			<!-- Shimmer -->
			<div class="pb-shimmer"></div>

			<!-- Glow tip (only if not full) -->
			{#if !completed && percentage > 3}
				<div class="pb-tip" style="box-shadow: 0 0 14px 5px {accent}; background: {lighten(accent)};"></div>
			{/if}

			<!-- Percentage inside bar -->
			{#if showPct && percentage > 15}
				<span class="pb-pct">{Math.round(percentage)}%</span>
			{/if}
		</div>

		<!-- Percentage outside bar (if fill too small) -->
		{#if showPct && percentage <= 15}
			<span class="pb-pct-outside" style="color: {accent};">{Math.round(percentage)}%</span>
		{/if}
	</div>

	<!-- Completed flash -->
	{#if completed}
		<div class="pb-completed" style="color: {accent};">¡Meta alcanzada! 🎉</div>
	{/if}
</div>

<style>
	.pb-root {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		box-sizing: border-box;
		font-family: system-ui, 'Inter', sans-serif;
		font-weight: 700;
		overflow: hidden;
	}

	.pb-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 8px;
		line-height: 1.2;
	}

	.pb-label {
		opacity: 0.9;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		flex: 1;
	}

	.pb-count {
		font-size: 0.78em;
		opacity: 0.75;
		white-space: nowrap;
		font-weight: 500;
	}

	.pb-track {
		flex: 1;
		min-height: 18px;
		background: rgba(255, 255, 255, 0.12);
		border-radius: 999px;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
	}

	.pb-fill {
		height: 100%;
		min-width: 4px;
		border-radius: 999px;
		position: relative;
		overflow: hidden;
		transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
		display: flex;
		align-items: center;
	}

	/* Animated shimmer moving across fill */
	.pb-shimmer {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.28) 45%,
			rgba(255, 255, 255, 0.5) 50%,
			rgba(255, 255, 255, 0.28) 55%,
			transparent 100%
		);
		animation: shimmer 2.4s ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes shimmer {
		0%   { transform: translateX(-150%); }
		100% { transform: translateX(250%); }
	}

	/* Glowing tip at progress edge */
	.pb-tip {
		position: absolute;
		right: 0;
		top: -3px;
		bottom: -3px;
		width: 6px;
		border-radius: 999px;
	}

	.pb-pct {
		position: relative;
		font-size: 0.55em;
		opacity: 0.85;
		margin-left: auto;
		padding-right: 8px;
		pointer-events: none;
	}

	.pb-pct-outside {
		font-size: 0.6em;
		font-weight: 700;
		padding-left: 8px;
	}

	.pb-completed {
		text-align: center;
		font-size: 0.7em;
		animation: pulse 1s ease-in-out infinite alternate;
	}

	@keyframes pulse {
		from { opacity: 0.7; }
		to   { opacity: 1; }
	}
</style>
