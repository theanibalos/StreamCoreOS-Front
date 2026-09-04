<script lang="ts">
	import type { OverlayElement } from '../../types';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import EventLibrary from './EventLibrary.svelte';
	import AIPromptModal from '../builder/AIPromptModal.svelte';
	import {
		Code,
		Sparkles,
		FileCode,
		Palette,
		Terminal,
		BookOpen,
		Bot,
		Wand2
	} from '@lucide/svelte';

	let {
		element,
		onUpdate
	}: {
		element: OverlayElement;
		onUpdate: (updates: Partial<OverlayElement>) => void;
	} = $props();

	let activeTab = $state<'html' | 'css' | 'js' | 'library'>('html');
	let promptOpen = $state(false);

	function updateConfig(configUpdates: Record<string, any>) {
		onUpdate({ config: { ...(element.config || {}), ...configUpdates } });
	}

	function applySnippet(snippet: { html?: string; css?: string; js?: string }) {
		updateConfig({
			html: snippet.html ?? element.config?.html ?? '',
			css: snippet.css ?? element.config?.css ?? '',
			js: snippet.js ?? element.config?.js ?? ''
		});
		activeTab = 'js';
	}
</script>

<div class="space-y-4">
	<!-- Header Bar with AI Prompt button -->
	<div class="flex items-center justify-between pb-1 border-b">
		<div class="flex items-center gap-1.5">
			<Code class="w-3.5 h-3.5 text-primary" />
			<p class="text-xs font-semibold text-foreground tracking-tight">Editor de Código</p>
		</div>
		<Button
			variant="outline"
			size="sm"
			class="h-7 text-[10px] gap-1 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-purple-400"
			onclick={() => (promptOpen = true)}
			title="Generar y copiar prompt para ChatGPT / Claude"
		>
			<Bot class="w-3 h-3" />
			<span>Prompt IA</span>
		</Button>
	</div>

	<!-- Top Tabs -->
	<Tabs value={activeTab} onValueChange={(v) => (activeTab = v as any)}>
		<TabsList class="w-full grid grid-cols-4 h-8 p-0.5">
			<TabsTrigger value="html" class="text-[11px] p-0 font-medium">
				<FileCode class="w-3 h-3 mr-1 text-orange-400" />
				HTML
			</TabsTrigger>
			<TabsTrigger value="css" class="text-[11px] p-0 font-medium">
				<Palette class="w-3 h-3 mr-1 text-sky-400" />
				CSS
			</TabsTrigger>
			<TabsTrigger value="js" class="text-[11px] p-0 font-medium">
				<Terminal class="w-3 h-3 mr-1 text-amber-400" />
				JS
			</TabsTrigger>
			<TabsTrigger value="library" class="text-[11px] p-0 font-semibold text-primary">
				<BookOpen class="w-3 h-3 mr-1 text-primary" />
				Docs
			</TabsTrigger>
		</TabsList>

		<TabsContent value="html" class="pt-2">
			<div class="flex items-center justify-between mb-1.5">
				<p class="text-[10px] font-medium text-muted-foreground">Estructura HTML</p>
				<span class="text-[9px] text-muted-foreground font-mono">DOM</span>
			</div>
			<Textarea
				class="min-h-[220px] text-xs font-mono resize-y bg-black/40 leading-relaxed"
				value={(element.config?.html as string) ?? ''}
				oninput={(e: Event) => updateConfig({ html: (e.target as HTMLTextAreaElement).value })}
				placeholder="<div class='custom'>...</div>"
			/>
		</TabsContent>

		<TabsContent value="css" class="pt-2">
			<div class="flex items-center justify-between mb-1.5">
				<p class="text-[10px] font-medium text-muted-foreground">Estilos CSS Aislados</p>
				<span class="text-[9px] text-muted-foreground font-mono">Scoped</span>
			</div>
			<Textarea
				class="min-h-[220px] text-xs font-mono resize-y bg-black/40 leading-relaxed"
				value={(element.config?.css as string) ?? ''}
				oninput={(e: Event) => updateConfig({ css: (e.target as HTMLTextAreaElement).value })}
				placeholder={".custom { background: rgba(0, 0, 0, 0.8); }"}
			/>
		</TabsContent>

		<TabsContent value="js" class="pt-2">
			<div class="flex items-center justify-between mb-1.5">
				<p class="text-[10px] font-medium text-muted-foreground">Script JavaScript</p>
				<Badge variant="outline" class="text-[8px] py-0 px-1 font-mono text-emerald-400 border-emerald-500/30">
					streamupdate
				</Badge>
			</div>
			<Textarea
				class="min-h-[220px] text-xs font-mono resize-y bg-black/40 leading-relaxed"
				value={(element.config?.js as string) ?? ''}
				oninput={(e: Event) => updateConfig({ js: (e.target as HTMLTextAreaElement).value })}
				placeholder={"window.addEventListener('streamupdate', (event) => {\n  const stats = event.detail.stats;\n  const alerts = event.detail.activeAlerts;\n  const chat = event.detail.chatMessages;\n});"}
			/>
			<p class="text-[9px] text-muted-foreground mt-1.5 px-1 italic">
				Suscribite a <code>window.addEventListener('streamupdate', e =&gt; ...)</code> para recibir datos en vivo.
			</p>
		</TabsContent>

		<TabsContent value="library" class="pt-2">
			<EventLibrary onInsertSnippet={applySnippet} />
		</TabsContent>
	</Tabs>
</div>

<!-- AI Prompt Generator Modal -->
<AIPromptModal
	bind:open={promptOpen}
/>
