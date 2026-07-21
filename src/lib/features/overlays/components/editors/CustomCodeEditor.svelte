<script lang="ts">
	import type { OverlayElement } from '../../types';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Textarea } from '$lib/components/ui/textarea';

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
	<Tabs value={activeTab} onValueChange={(v) => activeTab = v as 'html' | 'css' | 'js'}>
		<TabsList class="w-full">
			<TabsTrigger value="html" class="flex-1">HTML</TabsTrigger>
			<TabsTrigger value="css" class="flex-1">CSS</TabsTrigger>
			<TabsTrigger value="js" class="flex-1">JS</TabsTrigger>
		</TabsList>

		<TabsContent value="html">
			<p class="text-[10px] font-medium text-muted-foreground mb-1">Estructura HTML</p>
			<Textarea
				class="min-h-[220px] text-xs font-mono resize-y"
				value={element.config?.html as string ?? ''}
				oninput={(e: Event) => updateConfig({ html: (e.target as HTMLTextAreaElement).value })}
				placeholder="<div class='custom'>...</div>"
			/>
		</TabsContent>
		<TabsContent value="css">
			<p class="text-[10px] font-medium text-muted-foreground mb-1">Estilos CSS</p>
			<Textarea
				class="min-h-[220px] text-xs font-mono resize-y"
				value={element.config?.css as string ?? ''}
				oninput={(e: Event) => updateConfig({ css: (e.target as HTMLTextAreaElement).value })}
				placeholder={".custom { color: purple; }"}
			/>
		</TabsContent>
		<TabsContent value="js">
			<p class="text-[10px] font-medium text-muted-foreground mb-1">Script JavaScript</p>
			<Textarea
				class="min-h-[220px] text-xs font-mono resize-y"
				value={element.config?.js as string ?? ''}
				oninput={(e: Event) => updateConfig({ js: (e.target as HTMLTextAreaElement).value })}
				placeholder={"window.addEventListener('streamupdate', (e) => { ... })"}
			/>
			<p class="text-[9px] text-muted-foreground mt-1 px-1 italic">
				Escuchá <code>streamupdate</code> en window para datos en vivo.
			</p>
		</TabsContent>
	</Tabs>
</div>
