<script lang="ts">
	import type { OverlayElement } from '../../types';

	let {
		element,
		onUpdate
	}: {
		element: OverlayElement;
		onUpdate: (updates: Partial<OverlayElement>) => void;
	} = $props();

	let activeTab = $state<'html' | 'css' | 'js'>('html');

	function updateConfig(configUpdates: Record<string, any>) {
		onUpdate({ config: { ...(element.config || {}), ...configUpdates } });
	}
</script>

<div class="space-y-4">
	<p class="text-xs font-medium text-muted-foreground uppercase tracking-tight">Código Personalizado</p>
	<div class="flex border-b border-border">
		<button
			class="flex-1 pb-1.5 text-xs font-semibold border-b-2 transition-colors {activeTab === 'html' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => activeTab = 'html'}
		>
			HTML
		</button>
		<button
			class="flex-1 pb-1.5 text-xs font-semibold border-b-2 transition-colors {activeTab === 'css' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => activeTab = 'css'}
		>
			CSS
		</button>
		<button
			class="flex-1 pb-1.5 text-xs font-semibold border-b-2 transition-colors {activeTab === 'js' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}"
			onclick={() => activeTab = 'js'}
		>
			JS
		</button>
	</div>

	{#if activeTab === 'html'}
		<div>
			<p class="text-[10px] font-medium text-muted-foreground mb-1">Estructura HTML</p>
			<textarea
				class="w-full min-h-[220px] p-2.5 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
				value={element.config?.html as string ?? ''}
				oninput={(e) => updateConfig({ html: (e.target as HTMLTextAreaElement).value })}
				placeholder="<div class='custom'>...</div>"
			></textarea>
		</div>
	{:else if activeTab === 'css'}
		<div>
			<p class="text-[10px] font-medium text-muted-foreground mb-1">Estilos CSS</p>
			<textarea
				class="w-full min-h-[220px] p-2.5 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
				value={element.config?.css as string ?? ''}
				oninput={(e) => updateConfig({ css: (e.target as HTMLTextAreaElement).value })}
				placeholder={".custom { color: purple; }"}
			></textarea>
		</div>
	{:else if activeTab === 'js'}
		<div>
			<p class="text-[10px] font-medium text-muted-foreground mb-1">Script JavaScript</p>
			<textarea
				class="w-full min-h-[220px] p-2.5 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
				value={element.config?.js as string ?? ''}
				oninput={(e) => updateConfig({ js: (e.target as HTMLTextAreaElement).value })}
				placeholder={"window.addEventListener('streamupdate', (e) => { ... })"}
			></textarea>
			<p class="text-[9px] text-muted-foreground mt-1 px-1 italic">
				Escuchá <code>streamupdate</code> en window para datos en vivo.
			</p>
		</div>
	{/if}
</div>
