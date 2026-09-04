<script lang="ts">
	import type { OverlayElement } from '../../types';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import EventLibrary from '../editors/EventLibrary.svelte';
	import AIPromptModal from './AIPromptModal.svelte';
	import {
		Code,
		Eye,
		Sparkles,
		FileCode,
		Palette,
		Terminal,
		BookOpen,
		Bot,
		Plus,
		Check,
		Copy,
		RefreshCw,
		Layers
	} from '@lucide/svelte';

	let {
		elements,
		selected,
		onSelect,
		onUpdate,
		onAddCustomCode
	}: {
		elements: OverlayElement[];
		selected: OverlayElement | null;
		onSelect: (id: string) => void;
		onUpdate: (updates: Partial<OverlayElement>) => void;
		onAddCustomCode: () => void;
	} = $props();

	let activeCodeTab = $state<'html' | 'css' | 'js' | 'library'>('html');
	let promptModalOpen = $state(false);
	let copiedTab = $state<string | null>(null);

	// Find active custom_code element (selected or first available)
	const customCodeElements = $derived(elements.filter((e) => e.type === 'custom_code'));
	const currentElement = $derived(
		selected?.type === 'custom_code'
			? selected
			: customCodeElements.length > 0
				? customCodeElements[0]
				: null
	);

	const html = $derived((currentElement?.config?.html as string) ?? '');
	const css = $derived((currentElement?.config?.css as string) ?? '');
	const js = $derived((currentElement?.config?.js as string) ?? '');

	function updateCurrentConfig(configUpdates: Record<string, any>) {
		if (!currentElement) return;
		onUpdate({ config: { ...(currentElement.config || {}), ...configUpdates } });
	}

	function applySnippet(snippet: { html?: string; css?: string; js?: string }) {
		if (!currentElement) {
			onAddCustomCode();
			return;
		}
		updateCurrentConfig({
			html: snippet.html ?? html,
			css: snippet.css ?? css,
			js: snippet.js ?? js
		});
		activeCodeTab = 'js';
	}

	function copyCurrentCode(text: string, tabName: string) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
			copiedTab = tabName;
			setTimeout(() => {
				if (copiedTab === tabName) copiedTab = null;
			}, 2000);
		}
	}

	const openScript = '<scr' + 'ipt>';
	const closeScript = '</scr' + 'ipt>';

	const previewSrcdoc = $derived(`
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="utf-8">
			<base href="${typeof window !== 'undefined' ? window.location.origin : ''}/">
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
					stats: {
						'followers.total': '8420',
						'stream.viewer_count': '1240',
						'subscribers.active_total': '450',
						'bits.total': '15000',
						'stream.online': 'true'
					},
					activeAlerts: [
						{
							elementId: '__broadcast__',
							type: 'youtube.superchat',
							expiresAt: Date.now() + 999999,
							vars: {
								user_name: 'AlexYT',
								display_amount: '$10.00',
								message: '¡Excelente stream!'
							}
						}
					],
					chatMessages: {
						'${currentElement?.id || 'preview'}': [
							{
								platform: 'youtube',
								display_name: 'AlexYT',
								message: '¡Saludos desde YouTube!',
								timestamp: Date.now() - 5000,
								user: {
									avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlexYT',
									display_name: 'AlexYT'
								},
								roles: { subscriber: true }
							},
							{
								platform: 'twitch',
								display_name: 'TwitchUser',
								message: 'PogChamp',
								timestamp: Date.now() - 2000,
								color: '#a970ff',
								fragments: [{ type: 'emote', text: 'PogChamp', emote_id: '88', emote_animated: false }]
							}
						]
					}
				};

				window.addEventListener('message', (event) => {
					if (event.data && event.data.type === 'update') {
						window.StreamCore = event.data.payload;
						window.dispatchEvent(new CustomEvent('streamupdate', { detail: event.data.payload }));
					}
				});

				window.addEventListener('DOMContentLoaded', () => {
					window.dispatchEvent(new CustomEvent('streamupdate', { detail: window.StreamCore }));
				});
			${closeScript}
		</head>
		<body>
			${html}
			${openScript}
				try {
					${js}
				} catch (err) {
					console.error('[Preview CodeStudio] Error:', err);
				}
			${closeScript}
		</body>
		</html>
	`);
</script>

<div class="flex-1 flex flex-col overflow-hidden bg-background">
	{#if !currentElement}
		<!-- No custom code element exists yet -->
		<div class="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
			<div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
				<Code class="w-8 h-8" />
			</div>
			<div class="max-w-md space-y-1.5">
				<h3 class="text-base font-semibold text-foreground">Editor de Código de Espacio Completo</h3>
				<p class="text-xs text-muted-foreground leading-relaxed">
					No hay ningún elemento de código personalizado en el overlay todavía. Crea uno para programar con HTML, CSS, JavaScript y la librería de eventos en vivo.
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="default" size="sm" class="gap-1.5 bg-primary hover:bg-primary/90" onclick={onAddCustomCode}>
					<Plus class="w-4 h-4" />
					<span>Crear Widget de Código</span>
				</Button>
				<Button variant="outline" size="sm" class="gap-1.5 border-purple-500/30 text-purple-400 bg-purple-500/10" onclick={() => (promptModalOpen = true)}>
					<Bot class="w-4 h-4" />
					<span>Prompt para IA</span>
				</Button>
			</div>
		</div>
	{:else}
		<!-- Top Bar of Code Workspace -->
		<div class="px-4 py-2 border-b bg-card/40 flex items-center justify-between shrink-0 flex-wrap gap-2">
			<!-- Element Selector if multiple custom_code exist -->
			<div class="flex items-center gap-2">
				<div class="flex items-center gap-1.5">
					<Code class="w-4 h-4 text-primary" />
					<span class="text-xs font-semibold text-foreground">Widget:</span>
				</div>
				{#if customCodeElements.length > 1}
					<select
						class="h-7 rounded-md border bg-background px-2 text-xs font-mono font-medium"
						value={currentElement.id}
						onchange={(e) => onSelect((e.target as HTMLSelectElement).value)}
					>
						{#each customCodeElements as el}
							<option value={el.id}>Código ({el.id})</option>
						{/each}
					</select>
				{:else}
					<Badge variant="outline" class="text-[10px] font-mono bg-primary/10 text-primary border-primary/20">
						{currentElement.id}
					</Badge>
				{/if}
			</div>

			<!-- Quick Actions in Header -->
			<div class="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					class="h-7 text-xs gap-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30"
					onclick={() => (promptModalOpen = true)}
				>
					<Bot class="w-3.5 h-3.5" />
					<span>Prompt IA</span>
				</Button>
			</div>
		</div>

		<!-- Split Workspace: Code Editor Tabs on Left, Real-Time Preview Sandbox on Right -->
		<div class="flex-1 grid grid-cols-12 overflow-hidden">
			<!-- Code Tabs & Editor (7 cols) -->
			<div class="col-span-7 border-r flex flex-col overflow-hidden bg-card/20">
				<Tabs value={activeCodeTab} onValueChange={(v) => (activeCodeTab = v as any)} class="flex-1 flex flex-col overflow-hidden">
					<!-- Top Sub-Tabs -->
					<div class="px-4 pt-2.5 pb-2 border-b bg-muted/20 flex items-center justify-between shrink-0">
						<TabsList class="h-8">
							<TabsTrigger value="html" class="text-xs gap-1.5 px-3">
								<FileCode class="w-3.5 h-3.5 text-orange-400" />
								HTML
							</TabsTrigger>
							<TabsTrigger value="css" class="text-xs gap-1.5 px-3">
								<Palette class="w-3.5 h-3.5 text-sky-400" />
								CSS
							</TabsTrigger>
							<TabsTrigger value="js" class="text-xs gap-1.5 px-3">
								<Terminal class="w-3.5 h-3.5 text-amber-400" />
								JavaScript
							</TabsTrigger>
							<TabsTrigger value="library" class="text-xs gap-1.5 px-3 font-semibold text-primary">
								<BookOpen class="w-3.5 h-3.5 text-primary" />
								Librería & Snippets
							</TabsTrigger>
						</TabsList>

						<div class="flex items-center gap-2">
							{#if activeCodeTab === 'html'}
								<Button variant="ghost" size="sm" class="h-6 text-[10px] px-2 text-muted-foreground" onclick={() => copyCurrentCode(html, 'html')}>
									{#if copiedTab === 'html'}<Check class="w-3 h-3 text-emerald-400 mr-1" />Copiado{:else}<Copy class="w-3 h-3 mr-1" />Copiar HTML{/if}
								</Button>
							{:else if activeCodeTab === 'css'}
								<Button variant="ghost" size="sm" class="h-6 text-[10px] px-2 text-muted-foreground" onclick={() => copyCurrentCode(css, 'css')}>
									{#if copiedTab === 'css'}<Check class="w-3 h-3 text-emerald-400 mr-1" />Copiado{:else}<Copy class="w-3 h-3 mr-1" />Copiar CSS{/if}
								</Button>
							{:else if activeCodeTab === 'js'}
								<Button variant="ghost" size="sm" class="h-6 text-[10px] px-2 text-muted-foreground" onclick={() => copyCurrentCode(js, 'js')}>
									{#if copiedTab === 'js'}<Check class="w-3 h-3 text-emerald-400 mr-1" />Copiado{:else}<Copy class="w-3 h-3 mr-1" />Copiar JS{/if}
								</Button>
							{/if}
						</div>
					</div>

					<!-- HTML Tab Content -->
					<TabsContent value="html" class="flex-1 p-4 m-0 overflow-hidden flex flex-col">
						<Textarea
							class="flex-1 w-full font-mono text-xs p-4 bg-black/50 border-muted resize-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed rounded-xl select-text"
							value={html}
							oninput={(e: Event) => updateCurrentConfig({ html: (e.target as HTMLTextAreaElement).value })}
							placeholder="<div class='custom'>...</div>"
						/>
					</TabsContent>

					<!-- CSS Tab Content -->
					<TabsContent value="css" class="flex-1 p-4 m-0 overflow-hidden flex flex-col">
						<Textarea
							class="flex-1 w-full font-mono text-xs p-4 bg-black/50 border-muted resize-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed rounded-xl select-text"
							value={css}
							oninput={(e: Event) => updateCurrentConfig({ css: (e.target as HTMLTextAreaElement).value })}
							placeholder={".custom { background: rgba(0,0,0,0.8); }"}
						/>
					</TabsContent>

					<!-- JS Tab Content -->
					<TabsContent value="js" class="flex-1 p-4 m-0 overflow-hidden flex flex-col">
						<Textarea
							class="flex-1 w-full font-mono text-xs p-4 bg-black/50 border-muted resize-none focus-visible:ring-1 focus-visible:ring-primary leading-relaxed rounded-xl select-text"
							value={js}
							oninput={(e: Event) => updateCurrentConfig({ js: (e.target as HTMLTextAreaElement).value })}
							placeholder={"window.addEventListener('streamupdate', (event) => {\n  const stats = event.detail.stats;\n  const alerts = event.detail.activeAlerts;\n  const chat = event.detail.chatMessages;\n});"}
						/>
					</TabsContent>

					<!-- Library Tab Content -->
					<TabsContent value="library" class="flex-1 p-4 m-0 overflow-y-auto custom-scrollbar">
						<EventLibrary onInsertSnippet={applySnippet} />
					</TabsContent>
				</Tabs>
			</div>

			<!-- Live Preview Sandbox Panel (5 cols) -->
			<div class="col-span-5 flex flex-col overflow-hidden bg-black/60">
				<div class="px-4 py-2.5 border-b bg-card/40 flex items-center justify-between shrink-0">
					<div class="flex items-center gap-2">
						<Eye class="w-3.5 h-3.5 text-primary" />
						<span class="text-xs font-semibold text-foreground">Sandbox en Vivo</span>
					</div>
					<Badge variant="outline" class="text-[9px] font-mono text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
						Render en Tiempo Real
					</Badge>
				</div>

				<div class="flex-1 p-4 flex items-center justify-center overflow-hidden checkerboard-bg">
					<div class="w-full h-full max-w-[460px] max-h-[380px] bg-transparent rounded-xl border border-white/10 shadow-2xl overflow-hidden relative">
						<iframe
							srcdoc={previewSrcdoc}
							title="Live Code Workspace Preview"
							sandbox="allow-scripts allow-same-origin"
							allowtransparency={"true" as any}
							class="w-full h-full border-none bg-transparent"
						></iframe>
					</div>
				</div>

				<!-- Live Feed Info Bar -->
				<div class="p-3 border-t bg-card/60 text-[11px] space-y-1.5 shrink-0">
					<span class="text-muted-foreground font-medium text-[10px] uppercase tracking-wider">Fuentes de Datos Activas:</span>
					<div class="flex flex-wrap gap-1">
						<span class="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono">
							🔴 YouTube Chat & SuperChats
						</span>
						<span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono">
							🟣 Twitch Chat & Emotes
						</span>
						<span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
							📊 Stats en Tiempo Real
						</span>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<AIPromptModal bind:open={promptModalOpen} />

<style>
	.checkerboard-bg {
		background-color: #0d0d12;
		background-image: linear-gradient(45deg, #16161f 25%, transparent 25%),
			linear-gradient(-45deg, #16161f 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #16161f 75%),
			linear-gradient(-45deg, transparent 75%, #16161f 75%);
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	}

	.custom-scrollbar::-webkit-scrollbar {
		width: 5px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 9999px;
	}
</style>
