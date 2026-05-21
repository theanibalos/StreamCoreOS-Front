<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Layers, Trash2, Copy } from '@lucide/svelte';
	import type { OverlayElement, ElementStyle } from '../../index';

	let { 
		selected, 
		onUpdate, 
		onDelete, 
		onDuplicate 
	}: { 
		selected: OverlayElement | null;
		onUpdate: (updates: Partial<OverlayElement>) => void;
		onDelete: () => void;
		onDuplicate: () => void;
	} = $props();

	const ANIMATIONS: { value: ElementStyle['animation']; label: string }[] = [
		{ value: 'scale_in', label: 'Escalar' },
		{ value: 'fade_in', label: 'Desvanecer' },
		{ value: 'slide_up', label: 'Deslizar arriba' },
		{ value: 'slide_down', label: 'Deslizar abajo' }
	];

	function updateStyle(styleUpdates: Partial<ElementStyle>) {
		if (!selected) return;
		onUpdate({
			style: { ...selected.style, ...styleUpdates }
		});
	}

	function updateConfig(configUpdates: Record<string, any>) {
		if (!selected) return;
		onUpdate({
			config: { ...(selected.config || {}), ...configUpdates }
		});
	}

	const ELEMENT_LABELS: Record<string, string> = {
		alert: 'Alerta',
		stat: 'Estadística',
		chat_highlight: 'Chat Highlight',
		banner: 'Banner',
		progress_bar: 'Progreso'
	};
</script>

<div class="w-80 border-l bg-card/30 flex flex-col overflow-hidden">
	<div class="p-4 border-b bg-card flex items-center justify-between">
		<h3 class="text-sm font-semibold flex items-center gap-2">
			<Layers class="w-4 h-4 text-primary" />
			Propiedades
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
						<span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
							{ELEMENT_LABELS[selected.type]}
						</span>
						<span class="text-[10px] text-muted-foreground font-mono">{selected.id}</span>
					</div>
				</div>

				<!-- Size & Position -->
				<div>
					<p class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-tight">Posición y Tamaño</p>
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

				<!-- Specific Config -->
				{#if selected.type === 'alert'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Evento</p>
						<Input class="h-8 text-xs" value={selected.trigger?.event} oninput={(e) => onUpdate({ trigger: { ...selected.trigger!, event: (e.target as HTMLInputElement).value } })} />
					</div>
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Filtro usuario (opcional)</p>
						<Input class="h-8 text-xs" placeholder="Broadcaster..." value={selected.trigger?.filter_user} oninput={(e) => onUpdate({ trigger: { ...selected.trigger!, filter_user: (e.target as HTMLInputElement).value } })} />
					</div>
				{/if}

				{#if selected.type === 'stat' || selected.type === 'progress_bar'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Fuente de datos</p>
						<Input class="h-8 text-xs" value={selected.data_source} oninput={(e) => onUpdate({ data_source: (e.target as HTMLInputElement).value })} />
					</div>
				{/if}

				{#if selected.type === 'progress_bar'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Meta (Target)</p>
						<Input type="number" class="h-8 text-xs" value={selected.config?.target} oninput={(e) => updateConfig({ target: parseInt((e.target as HTMLInputElement).value) || 100 })} />
					</div>
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Etiqueta</p>
						<Input class="h-8 text-xs" value={selected.config?.label} oninput={(e) => updateConfig({ label: (e.target as HTMLInputElement).value })} />
					</div>
				{/if}

				<!-- Content Template -->
				<div>
					<p class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-tight">Template HTML/Text</p>
					<textarea
						class="w-full min-h-[100px] p-3 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
						value={selected.template}
						oninput={(e) => onUpdate({ template: (e.target as HTMLTextAreaElement).value })}
					></textarea>
					<p class="text-[9px] text-muted-foreground mt-1 px-1 italic">Usa {`{user_name}`}, {`{bits}`}, etc.</p>
				</div>

				<!-- Animation -->
				{#if selected.type === 'alert'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Duración (ms)</p>
						<Input type="number" class="h-8 text-xs" value={selected.style.duration_ms} oninput={(e) => updateStyle({ duration_ms: parseInt((e.target as HTMLInputElement).value) || 5000 })} />
					</div>
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Animación</p>
						<select
							class="w-full h-8 rounded-md border bg-background px-2 text-xs"
							value={selected.style.animation}
							onchange={(e) => updateStyle({ animation: (e.target as HTMLSelectElement).value as ElementStyle['animation'] })}
						>
							{#each ANIMATIONS as anim}
								<option value={anim.value}>{anim.label}</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Style Colors -->
				<div>
					<p class="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-tight">Visuales</p>
					<div class="space-y-3">
						{#each [['Fondo', 'background'], ['Acento', 'accent'], ['Texto', 'text_color']] as [label, key]}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">{label}</Label>
								<div class="flex items-center gap-1.5">
									<input
										type="color"
										value={(selected.style as Record<string, any>)[key]?.replace(/[0-9a-f]{2}$/i, '') ?? '#000000'}
										class="w-6 h-6 rounded cursor-pointer border-0 p-0 overflow-hidden"
										onchange={(e) => updateStyle({ [key]: (e.target as HTMLInputElement).value } as Partial<ElementStyle>)}
									/>
									<Input
										class="h-6 w-24 text-[10px] font-mono px-1.5"
										value={(selected.style as Record<string, any>)[key] ?? ''}
										oninput={(e) => updateStyle({ [key]: (e.target as HTMLInputElement).value } as Partial<ElementStyle>)}
									/>
								</div>
							</div>
						{/each}

						<div class="flex items-center justify-between">
							<Label class="text-[10px] text-muted-foreground">Border radius</Label>
							<Input
								type="number" min="0" max="60"
								class="h-6 w-24 text-xs"
								value={selected.style.border_radius}
								oninput={(e) => updateStyle({ border_radius: parseInt((e.target as HTMLInputElement).value) || 0 })}
							/>
						</div>

						<div class="flex items-center justify-between">
							<Label class="text-[10px] text-muted-foreground">Font size</Label>
							<Input
								type="number" min="10" max="120"
								class="h-6 w-24 text-xs"
								value={selected.style.font_size}
								oninput={(e) => updateStyle({ font_size: parseInt((e.target as HTMLInputElement).value) || 24 })}
							/>
						</div>

						<div class="flex items-center justify-between">
							<Label class="text-[10px] text-muted-foreground">Glow</Label>
							<button
								class="text-[10px] px-2.5 py-1 rounded border font-bold transition-colors {selected.style.glow ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'}"
								onclick={() => updateStyle({ glow: !selected.style.glow })}
							>
								{selected.style.glow ? 'ACTIVO' : 'DESACTIVADO'}
							</button>
						</div>

						<div class="pt-1">
							<div class="flex items-center justify-between mb-1.5">
								<Label class="text-[10px] text-muted-foreground">Opacidad</Label>
								<span class="text-[10px] font-mono text-muted-foreground">{selected.style.opacity ?? 100}%</span>
							</div>
							<input
								type="range"
								min="0"
								max="100"
								step="1"
								class="w-full h-1 appearance-none rounded-full bg-muted cursor-pointer accent-primary"
								value={selected.style.opacity ?? 100}
								oninput={(e) => updateStyle({ opacity: parseInt((e.target as HTMLInputElement).value) })}
							/>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-6 gap-3 py-20">
				<div class="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-2">
					<Layers class="w-6 h-6 opacity-20" />
				</div>
				<p class="text-xs font-medium">Sin selección</p>
				<p class="text-[10px] opacity-60">Seleccioná un elemento en el canvas para editar sus propiedades</p>
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
