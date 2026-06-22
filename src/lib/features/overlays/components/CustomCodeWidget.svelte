<script module lang="ts">
	import { Code } from '@lucide/svelte';
	import type { WidgetMeta } from '../types';
	import CustomCodeEditor from './editors/CustomCodeEditor.svelte';

	export const meta: WidgetMeta = {
		label: 'Código',
		icon: Code,
		defaults: {
			width: 400, height: 300,
			config: {
				html: '<div class="card">\n  <h2>¡Hola Stream!</h2>\n  <p>Seguidores: <span id="followers">0</span></p>\n</div>',
				css: '.card {\n  background: rgba(0, 0, 0, 0.7);\n  border: 2px solid #9147ff;\n  border-radius: 12px;\n  padding: 20px;\n  text-align: center;\n  box-shadow: 0 4px 20px rgba(145, 71, 255, 0.4);\n}\nh2 {\n  margin: 0 0 10px 0;\n  color: #9147ff;\n}',
				js: '// Escucha actualizaciones del stream en tiempo real\nwindow.addEventListener("streamupdate", (e) => {\n  const stats = e.detail.stats;\n  const followersEl = document.getElementById("followers");\n  if (followersEl) {\n    followersEl.innerText = stats["followers.total"] || "0";\n  }\n});'
			},
			style: { background: 'transparent', accent: '#9147ff', border_radius: 0, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 16, text_color: '#ffffff', opacity: 100 }
		},
		style: {},
		hasTemplate: false,
		Editor: CustomCodeEditor
	};
</script>

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
	const opacity = $derived((element.style.opacity ?? 100) / 100);

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

<div class="custom-code-root" style="opacity: {opacity};">
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
