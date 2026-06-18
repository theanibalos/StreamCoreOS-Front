<script lang="ts">
	import type { OverlayElement, ActiveAlert, ChatMessage } from '../types';
	import { onMount } from 'svelte';

	let {
		element,
		statValues = {},
		activeAlerts = [],
		chatMessages = {}
	}: {
		element: OverlayElement;
		statValues: Record<string, string>;
		activeAlerts: ActiveAlert[];
		chatMessages: Record<string, ChatMessage[]>;
	} = $props();

	const html = $derived((element.config?.html as string) ?? '');
	const css  = $derived((element.config?.css as string) ?? '');
	const js   = $derived((element.config?.js as string) ?? '');

	let iframeRef = $state<HTMLIFrameElement | null>(null);

	// Split script tags to prevent Svelte compiler from processing them as real Svelte tags
	const openScript = '<scr' + 'ipt>';
	const closeScript = '</scr' + 'ipt>';

	const srcdoc = $derived(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<style>
				html, body {
					margin: 0;
					padding: 0;
					background: transparent !important;
					background-color: transparent !important;
					color: white;
					font-family: system-ui, -apple-system, sans-serif;
					overflow: hidden;
				}
				${css}
			</style>
			${openScript}
				window.StreamCore = {
					stats: {},
					activeAlerts: [],
					chatMessages: {}
				};

				window.addEventListener('message', (event) => {
					if (event.data && event.data.type === 'update') {
						window.StreamCore = event.data.payload;
						window.dispatchEvent(new CustomEvent('streamupdate', { detail: event.data.payload }));
					}
				});

				// Notify parent that iframe is ready to receive initial data after DOM is fully parsed
				window.addEventListener('DOMContentLoaded', () => {
					window.parent.postMessage({ type: 'iframe_ready' }, '*');
				});
			${closeScript}
		</head>
		<body>
			${html}
			${openScript}
				try {
					${js}
				} catch (err) {
					console.error('[SCO-CustomCode] Error running script:', err);
				}
			${closeScript}
		</body>
		</html>
	`);

	function sendUpdate() {
		if (iframeRef && iframeRef.contentWindow) {
			iframeRef.contentWindow.postMessage({
				type: 'update',
				payload: {
					stats: $state.snapshot(statValues),
					activeAlerts: $state.snapshot(activeAlerts),
					chatMessages: $state.snapshot(chatMessages)
				}
			}, '*');
		}
	}

	// Watch for any changes in the Svelte state and push updates to the iframe
	$effect(() => {
		// Reactive dependencies
		const _stats = statValues;
		const _alerts = activeAlerts;
		const _chat = chatMessages;
		sendUpdate();
	});

	onMount(() => {
		const handleMessage = (e: MessageEvent) => {
			if (e.data && e.data.type === 'iframe_ready') {
				// Only respond if the message is coming from our iframe
				if (iframeRef && e.source === iframeRef.contentWindow) {
					sendUpdate();
				}
			}
		};

		window.addEventListener('message', handleMessage);
		return () => {
			window.removeEventListener('message', handleMessage);
		};
	});
</script>

<div class="custom-code-root">
	{#if !html && !css && !js}
		<div class="placeholder">
			<span>Código</span>
		</div>
	{:else}
		<iframe
			bind:this={iframeRef}
			{srcdoc}
			title="Custom Code Widget"
			sandbox="allow-scripts allow-same-origin"
			allowtransparency={"true" as any}
			style="background: transparent;"
			class="custom-code-iframe"
		></iframe>
	{/if}
</div>

<style>
	.custom-code-root {
		width: 100%;
		height: 100%;
		overflow: hidden;
		position: relative;
	}

	.custom-code-iframe {
		width: 100%;
		height: 100%;
		border: none;
		background: transparent;
	}

	.placeholder {
		width: 100%;
		height: 100%;
		background: rgba(255, 255, 255, 0.05);
		border: 2px dashed rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.3);
		font-family: sans-serif;
		font-weight: 800;
		text-transform: uppercase;
		font-size: 14px;
	}
</style>
