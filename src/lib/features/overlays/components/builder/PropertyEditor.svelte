<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Slider } from '$lib/components/ui/slider';
	import { tick } from 'svelte';
	import { Layers, Trash2, Copy, ImageIcon, ChevronUp, ChevronDown, Maximize, Minimize, Code, Bot } from '@lucide/svelte';
	import { WIDGET_REGISTRY } from '../../index';
	import type { OverlayElement, ElementStyle, EditorField } from '../../index';

	let {
		selected,
		elements = [],
		onSelect,
		onUpdate,
		onDelete,
		onDuplicate,
		onMoveLayer,
		canvasWidth = 1920,
		canvasHeight = 1080,
		onOpenCodeWorkspace,
		onOpenAIPrompt
	}: {
		selected: OverlayElement | null;
		elements?: OverlayElement[];
		onSelect: (id: string) => void;
		onUpdate: (updates: Partial<OverlayElement>) => void;
		onDelete: () => void;
		onDuplicate: () => void;
		onMoveLayer: (dir: 'up' | 'down' | 'front' | 'back') => void;
		canvasWidth?: number;
		canvasHeight?: number;
		onOpenCodeWorkspace?: () => void;
		onOpenAIPrompt?: () => void;
	} = $props();

	// Icons + labels derived from each widget's meta (no per-type hardcoding).
	const WIDGET_ICONS: Record<string, any> = Object.fromEntries(
		Object.entries(WIDGET_REGISTRY).map(([k, v]) => [k, v.meta.icon])
	);
	const ELEMENT_LABELS: Record<string, string> = Object.fromEntries(
		Object.entries(WIDGET_REGISTRY).map(([k, v]) => [k, v.meta.label])
	);

	const meta = $derived(selected ? WIDGET_REGISTRY[selected.type]?.meta : null);
	const EditorComponent = $derived(meta?.Editor ?? null);
	const caps = $derived(meta?.style ?? {});

	// Template variable chips — static list or computed from the element (e.g. alert event).
	const templateVars = $derived(
		!selected || !meta?.templateVars
			? []
			: typeof meta.templateVars === 'function'
				? meta.templateVars(selected)
				: meta.templateVars
	);

	let templateRef = $state<HTMLTextAreaElement | null>(null);

	async function insertVar(name: string) {
		if (!selected) return;
		const token = `{${name}}`;
		const cur = selected.template ?? '';
		const ta = templateRef;
		const start = ta?.selectionStart ?? cur.length;
		const end = ta?.selectionEnd ?? cur.length;
		onUpdate({ template: cur.slice(0, start) + token + cur.slice(end) });
		await tick();
		if (ta) {
			const pos = start + token.length;
			ta.focus();
			ta.setSelectionRange(pos, pos);
		}
	}

	function updateStyle(styleUpdates: Partial<ElementStyle>) {
		if (!selected) return;
		onUpdate({ style: { ...selected.style, ...styleUpdates } });
	}

	// Generic read/write for declarative fields against dot-paths
	// like 'data_source', 'config.target', 'trigger.event', 'style.duration_ms'.
	function getField(field: EditorField): any {
		if (!selected) return undefined;
		let v: any = selected;
		for (const p of field.key.split('.')) v = v?.[p];
		return v;
	}

	function writeField(key: string, value: any) {
		if (!selected) return;
		const parts = key.split('.');
		if (parts.length === 1) {
			onUpdate({ [parts[0]]: value } as Partial<OverlayElement>);
		} else {
			const [root, child] = parts;
			const current = (selected as any)[root] ?? {};
			onUpdate({ [root]: { ...current, [child]: value } } as Partial<OverlayElement>);
		}
	}

	function setField(field: EditorField, raw: string) {
		writeField(field.key, field.type === 'number' ? (parseInt(raw) || (field.fallback ?? 0)) : raw);
	}
</script>

<div class="w-80 border-l bg-card/30 flex flex-col overflow-hidden">
	<div class="p-4 border-b bg-card flex items-center justify-between">
		<h3 class="text-sm font-semibold flex items-center gap-2">
			{#if selected}
				<Layers class="w-4 h-4 text-primary" />
				Propiedades
			{:else}
				<ImageIcon class="w-4 h-4 text-primary" />
				Canvas
			{/if}
		</h3>
		{#if selected}
			<div class="flex items-center gap-1">
				<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-foreground" onclick={onDuplicate} title="Duplicar">
					<Copy class="w-4 h-4" />
				</Button>
				<Button variant="ghost" size="icon" class="h-8 w-8 text-destructive hover:bg-destructive/10" onclick={onDelete} title="Eliminar">
					<Trash2 class="w-4 h-4" />
				</Button>
			</div>
		{/if}
	</div>

	<div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
		{#if selected}
			<div class="space-y-6">
				<!-- Header info -->
				<div class="pb-4 border-b">
					<div class="flex items-center gap-2 mb-1">
						<Badge variant="outline" class="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border-transparent">
							{ELEMENT_LABELS[selected.type]}
						</Badge>
						<span class="text-[10px] text-muted-foreground font-mono">{selected.id}</span>
					</div>
				</div>

				<!-- Size & Position -->
				<div>
					<p class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-tight flex items-center justify-between">
						Orden de Capas
					</p>
					<div class="grid grid-cols-4 gap-1 mb-4">
						<Button variant="outline" size="icon" class="h-8 w-full" onclick={() => onMoveLayer('back')} title="Enviar al fondo">
							<Minimize class="w-3.5 h-3.5" />
						</Button>
						<Button variant="outline" size="icon" class="h-8 w-full" onclick={() => onMoveLayer('down')} title="Bajar una capa">
							<ChevronDown class="w-3.5 h-3.5" />
						</Button>
						<Button variant="outline" size="icon" class="h-8 w-full" onclick={() => onMoveLayer('up')} title="Subir una capa">
							<ChevronUp class="w-3.5 h-3.5" />
						</Button>
						<Button variant="outline" size="icon" class="h-8 w-full" onclick={() => onMoveLayer('front')} title="Traer al frente">
							<Maximize class="w-3.5 h-3.5" />
						</Button>
					</div>

					<p class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-tight text-left">Posición y Tamaño</p>
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-1.5">
							<Label class="text-[10px] text-muted-foreground ml-1">X (px)</Label>
							<Input type="number" class="h-8 text-xs" value={selected.x} oninput={(e) => onUpdate({ x: parseInt((e.target as HTMLInputElement).value) || 0 })} />
						</div>
						<div class="space-y-1.5">
							<Label class="text-[10px] text-muted-foreground ml-1">Y (px)</Label>
							<Input type="number" class="h-8 text-xs" value={selected.y} oninput={(e) => onUpdate({ y: parseInt((e.target as HTMLInputElement).value) || 0 })} />
						</div>
						<div class="space-y-1.5">
							<Label class="text-[10px] text-muted-foreground ml-1">Ancho (px)</Label>
							<Input type="number" class="h-8 text-xs" value={selected.width} oninput={(e) => onUpdate({ width: parseInt((e.target as HTMLInputElement).value) || 0 })} />
						</div>
						<div class="space-y-1.5">
							<Label class="text-[10px] text-muted-foreground ml-1">Alto (px)</Label>
							<Input type="number" class="h-8 text-xs" value={selected.height} oninput={(e) => onUpdate({ height: parseInt((e.target as HTMLInputElement).value) || 0 })} />
						</div>
					</div>
				</div>

				<!-- Bespoke editor UI provided by the widget (e.g. media, custom_code) -->
				{#if selected.type === 'custom_code'}
					<div class="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-3 shadow-sm">
						<div class="flex items-center gap-2">
							<div class="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
								<Code class="w-4 h-4" />
							</div>
							<div>
								<p class="text-xs font-semibold text-foreground">Código Personalizado</p>
								<p class="text-[10px] text-muted-foreground">HTML, CSS y JS con datos en vivo</p>
							</div>
						</div>

						<div class="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
							<div class="p-1.5 rounded bg-black/40 border border-white/5">
								<span class="text-orange-400 font-bold block">HTML</span>
								<span class="text-muted-foreground text-[9px]">{selected.config?.html ? 'Listo' : 'Vacío'}</span>
							</div>
							<div class="p-1.5 rounded bg-black/40 border border-white/5">
								<span class="text-sky-400 font-bold block">CSS</span>
								<span class="text-muted-foreground text-[9px]">{selected.config?.css ? 'Listo' : 'Vacío'}</span>
							</div>
							<div class="p-1.5 rounded bg-black/40 border border-white/5">
								<span class="text-amber-400 font-bold block">JS</span>
								<span class="text-muted-foreground text-[9px]">{selected.config?.js ? 'Listo' : 'Vacío'}</span>
							</div>
						</div>

						<div class="space-y-1.5 pt-1">
							<Button
								variant="default"
								size="sm"
								class="w-full text-xs gap-1.5 bg-primary hover:bg-primary/90 font-semibold shadow-sm"
								onclick={onOpenCodeWorkspace}
							>
								<Code class="w-3.5 h-3.5" />
								<span>Abrir en Editor Central</span>
							</Button>

							{#if onOpenAIPrompt}
								<Button
									variant="outline"
									size="sm"
									class="w-full text-xs gap-1.5 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 font-medium"
									onclick={onOpenAIPrompt}
								>
									<Bot class="w-3.5 h-3.5" />
									<span>Generar con IA (Prompt)</span>
								</Button>
							{/if}
						</div>
					</div>
				{:else if EditorComponent}
					{#key selected.id}
						<EditorComponent
							element={selected}
							{onUpdate}
							{onMoveLayer}
							{canvasWidth}
							{canvasHeight}
						/>
					{/key}
				{/if}

				<!-- Declarative config/trigger fields from the widget meta -->
				{#each meta?.fields ?? [] as field (field.key)}
					{#if field.type === 'toggle'}
						{@const on = (getField(field) ?? field.default) === true}
						<div class="flex items-center justify-between">
							<p class="text-xs font-medium text-muted-foreground">{field.label}</p>
							<Switch checked={on} onCheckedChange={(v) => writeField(field.key, v)} />
						</div>
					{:else}
						<div>
							<p class="text-xs font-medium text-muted-foreground mb-2">{field.label}</p>
							{#if field.type === 'select'}
								<select
									class="w-full h-8 rounded-md border bg-background px-2 text-xs"
									value={getField(field) ?? ''}
									onchange={(e) => setField(field, (e.target as HTMLSelectElement).value)}
								>
									{#each field.options ?? [] as opt (opt.value)}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							{:else if field.type === 'textarea'}
								<Textarea
									class="min-h-[80px] text-xs font-mono resize-y"
									value={getField(field) ?? ''}
									oninput={(e: Event) => setField(field, (e.target as HTMLTextAreaElement).value)}
									placeholder={field.placeholder}
								/>
							{:else}
								<Input
									type={field.type === 'number' ? 'number' : 'text'}
									class="h-8 text-xs"
									value={getField(field) ?? ''}
									placeholder={field.placeholder}
									oninput={(e) => setField(field, (e.target as HTMLInputElement).value)}
								/>
							{/if}
						</div>
					{/if}
				{/each}

				<!-- Content Template -->
				{#if meta?.hasTemplate}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-tight">Template HTML/Text</p>
						<textarea
							bind:this={templateRef}
							class="w-full min-h-[100px] p-3 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
							value={selected.template}
							oninput={(e) => onUpdate({ template: (e.target as HTMLTextAreaElement).value })}
						></textarea>
						{#if templateVars.length > 0}
							<div class="flex flex-wrap gap-1 mt-2">
								{#each templateVars as v (v.name)}
									<button
										type="button"
										class="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono hover:bg-primary/20 transition-colors"
										title={`Insertar ${v.label}`}
										onclick={() => insertVar(v.name)}
									>
										{`{${v.name}}`}
									</button>
								{/each}
							</div>
						{:else}
							<p class="text-[9px] text-muted-foreground mt-1 px-1 italic">Usa {`{user_name}`}, {`{bits}`}, etc.</p>
						{/if}
					</div>
				{/if}

				<!-- Style Colors -->
				<div>
					<p class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-tight">Visuales</p>
					<div class="space-y-3">
						{#if caps.background}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Fondo</Label>
								<div class="flex items-center gap-1.5">
									<input
										type="color"
										value={selected.style.background?.replace(/[0-9a-f]{2}$/i, '') ?? '#000000'}
										class="w-6 h-6 rounded cursor-pointer border-0 p-0 overflow-hidden"
										onchange={(e) => updateStyle({ background: (e.target as HTMLInputElement).value })}
									/>
									<Input
										class="h-6 w-24 text-[10px] font-mono px-1.5"
										value={selected.style.background ?? ''}
										oninput={(e) => updateStyle({ background: (e.target as HTMLInputElement).value })}
									/>
								</div>
							</div>
						{/if}

						{#if caps.accent}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Acento</Label>
								<div class="flex items-center gap-1.5">
									<input
										type="color"
										value={selected.style.accent?.replace(/[0-9a-f]{2}$/i, '') ?? '#000000'}
										class="w-6 h-6 rounded cursor-pointer border-0 p-0 overflow-hidden"
										onchange={(e) => updateStyle({ accent: (e.target as HTMLInputElement).value })}
									/>
									<Input
										class="h-6 w-24 text-[10px] font-mono px-1.5"
										value={selected.style.accent ?? ''}
										oninput={(e) => updateStyle({ accent: (e.target as HTMLInputElement).value })}
									/>
								</div>
							</div>
						{/if}

						{#if caps.textColor}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Texto</Label>
								<div class="flex items-center gap-1.5">
									<input
										type="color"
										value={selected.style.text_color?.replace(/[0-9a-f]{2}$/i, '') ?? '#000000'}
										class="w-6 h-6 rounded cursor-pointer border-0 p-0 overflow-hidden"
										onchange={(e) => updateStyle({ text_color: (e.target as HTMLInputElement).value })}
									/>
									<Input
										class="h-6 w-24 text-[10px] font-mono px-1.5"
										value={selected.style.text_color ?? ''}
										oninput={(e) => updateStyle({ text_color: (e.target as HTMLInputElement).value })}
									/>
								</div>
							</div>
						{/if}

						{#if caps.borderRadius}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Border radius</Label>
								<Input
									type="number" min="0" max="60"
									class="h-6 w-24 text-xs"
									value={selected.style.border_radius}
									oninput={(e) => updateStyle({ border_radius: parseInt((e.target as HTMLInputElement).value) || 0 })}
								/>
							</div>
						{/if}

						{#if caps.fontSize}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Font size</Label>
								<Input
									type="number" min="10" max="120"
									class="h-6 w-24 text-xs"
									value={selected.style.font_size}
									oninput={(e) => updateStyle({ font_size: parseInt((e.target as HTMLInputElement).value) || 24 })}
								/>
							</div>
						{/if}

						{#if caps.glow}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Glow</Label>
								<Switch checked={!!selected.style.glow} onCheckedChange={(v) => updateStyle({ glow: v })} />
							</div>
						{/if}

						<!-- Opacidad (siempre visible para ajustar el desvanecimiento del widget en el layout) -->
						<div class="pt-1">
							<div class="flex items-center justify-between mb-1.5">
								<Label class="text-[10px] text-muted-foreground">Opacidad</Label>
								<span class="text-[10px] font-mono text-muted-foreground">{selected.style.opacity ?? 100}%</span>
							</div>
							<Slider
								value={[selected.style.opacity ?? 100]}
								min={0}
								max={100}
								step={1}
								onValueChange={(v) => updateStyle({ opacity: v[0] })}
							/>
						</div>
					</div>
				</div>

				<!-- Lista de Capas (Cuando hay elemento seleccionado) -->
				<div class="border-t pt-4">
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
						Capas ({elements.length})
					</p>
					<div class="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
						{#each [...elements].reverse() as el}
							{@const Icon = WIDGET_ICONS[el.type] || Layers}
							<button
								class="w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all {el.id === selected.id ? 'border-primary bg-primary/20 text-white font-semibold shadow-sm' : 'border-border/50 bg-card/60 hover:bg-card/90 text-zinc-200'}"
								onclick={() => onSelect(el.id)}
							>
								<div class="flex items-center gap-1.5 truncate">
									<Icon class="w-3.5 h-3.5 shrink-0 text-primary" />
									<span class="truncate text-zinc-100 font-medium">{ELEMENT_LABELS[el.type] || el.type}</span>
									<span class="text-[9px] text-zinc-400 font-mono">({el.id})</span>
								</div>
							</button>
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<!-- Canvas Settings (no element selected) -->
			<div class="space-y-6">
				<div class="pt-2 text-center text-muted-foreground border-b pb-4">
					<div class="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-2">
						<Layers class="w-5 h-5 opacity-30 text-primary animate-pulse" />
					</div>
					<p class="text-xs font-semibold text-foreground">Canvas de Overlay</p>
					<p class="text-[10px] opacity-60 mt-0.5">Seleccioná un elemento para editar o añadí uno nuevo desde el menú izquierdo</p>
				</div>

				<!-- Lista de Capas Completa -->
				<div>
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
						Capas / Elementos ({elements.length})
					</p>
					{#if elements.length === 0}
						<p class="text-[10px] text-muted-foreground italic text-center py-6 bg-muted/5 rounded-lg border border-dashed">
							No hay elementos en pantalla.
						</p>
					{:else}
						<div class="space-y-2">
							{#each [...elements].reverse() as el}
								{@const Icon = WIDGET_ICONS[el.type] || Layers}
								<button
									class="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/60 bg-card/60 hover:bg-primary/10 hover:border-primary/40 transition-all text-left"
									onclick={() => onSelect(el.id)}
								>
									<div class="flex items-center gap-2 truncate">
										<Icon class="w-4 h-4 text-primary shrink-0" />
										<div class="flex flex-col truncate">
											<span class="text-xs font-semibold text-zinc-100 truncate">{ELEMENT_LABELS[el.type] || el.type}</span>
											<span class="text-[9px] text-zinc-400 font-mono truncate">{el.id}</span>
										</div>
									</div>
									<div class="text-[9px] text-zinc-300 font-mono bg-muted/70 px-1.5 py-0.5 rounded shrink-0">
										x:{Math.round(el.x)}, y:{Math.round(el.y)}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(0, 0, 0, 0.1);
		border-radius: 10px;
	}
	:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
	}
</style>
