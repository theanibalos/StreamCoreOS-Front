<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Layers, Trash2, Copy, ImageIcon, X, Loader, ChevronUp, ChevronDown, Maximize, Minimize, Expand, Zap, BarChart2, MessageSquare, Type, TrendingUp, Code } from '@lucide/svelte';
	import { upload } from '$lib/core/api/client';
	import { show } from '$lib/core/stores/toast.svelte';
	import BackgroundGallery from './BackgroundGallery.svelte';
	import type { OverlayElement, ElementStyle } from '../../index';

	let {
		selected,
		elements = [],
		onSelect,
		onUpdate,
		onDelete,
		onDuplicate,
		onMoveLayer,
		canvasWidth = 1920,
		canvasHeight = 1080
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
	} = $props();

	const WIDGET_ICONS: Record<string, any> = {
		alert: Zap,
		stat: BarChart2,
		chat_highlight: MessageSquare,
		banner: Type,
		progress_bar: TrendingUp,
		media: ImageIcon,
		custom_code: Code
	};

	let fileInputRef = $state<HTMLInputElement | null>(null);
	let uploading = $state(false);
	let activeTab = $state<'html' | 'css' | 'js'>('html');
	let lastSelectedId = $state<string | null>(null);

	$effect(() => {
		if (selected) {
			if (selected.id !== lastSelectedId) {
				lastSelectedId = selected.id;
				activeTab = 'html';
			}
		} else {
			lastSelectedId = null;
		}
	});

	const hasBackground   = $derived(selected && ['alert', 'stat', 'chat_highlight', 'banner', 'progress_bar'].includes(selected.type));
	const hasAccent       = $derived(selected && ['alert', 'stat', 'chat_highlight', 'banner', 'progress_bar', 'media'].includes(selected.type));
	const hasTextColor    = $derived(selected && ['alert', 'stat', 'chat_highlight', 'banner'].includes(selected.type));
	const hasBorderRadius = $derived(selected && ['alert', 'stat', 'chat_highlight', 'banner', 'progress_bar', 'media'].includes(selected.type));
	const hasFontSize     = $derived(selected && ['alert', 'stat', 'chat_highlight', 'banner', 'progress_bar'].includes(selected.type));
	const hasGlow         = $derived(selected && ['alert', 'stat', 'progress_bar', 'media'].includes(selected.type));

	async function handleFile(file: File) {
		const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
		if (!allowed.includes(file.type)) {
			show('Formato no soportado. Usá PNG, JPG, GIF, WebP, MP4 o WebM.', 'error');
			return;
		}
		uploading = true;
		try {
			const res = await upload<{ success: boolean; data: { url: string; type: 'image' | 'video' }; error?: string }>(
				'/overlays/upload-background', file
			);
			if (!res.success) throw new Error(res.error);
			updateConfig({ url: res.data.url });
		} catch (e: any) {
			show(`Error al subir: ${e.message}`, 'error');
		} finally {
			uploading = false;
		}
	}

	function onFileInput(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) handleFile(file);
		(e.target as HTMLInputElement).value = '';
	}

	function fitToCanvas() {
		onUpdate({
			x: 0,
			y: 0,
			width: canvasWidth,
			height: canvasHeight
		});
		onMoveLayer('back');
	}

	const ANIMATIONS: { value: ElementStyle['animation']; label: string }[] = [
		{ value: 'scale_in', label: 'Escalar' },
		{ value: 'fade_in', label: 'Desvanecer' },
		{ value: 'slide_up', label: 'Deslizar arriba' },
		{ value: 'slide_down', label: 'Deslizar abajo' }
	];

	const STAT_SOURCES = [
		{ value: 'subscribers.active_total', label: 'Suscriptores Activos' },
		{ value: 'followers.total',          label: 'Total de Seguidores' },
		{ value: 'stream.viewer_count',      label: 'Espectadores Actuales' },
		{ value: 'bits.total',               label: 'Total de Bits' },
		{ value: 'stream.online',            label: 'Estado Online (true/false)' }
	];

	const ALERT_EVENTS = [
		{ value: 'channel.follow',            label: 'Seguimiento (Follow)' },
		{ value: 'channel.subscribe',         label: 'Suscripción / Resub' },
		{ value: 'channel.subscription.gift', label: 'Sub Regalada' },
		{ value: 'channel.cheer',             label: 'Bits (Cheer)' },
		{ value: 'channel.raid',              label: 'Raid' },
		{ value: 'chat.message',              label: 'Mensaje de Chat' }
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
		progress_bar: 'Progreso',
		media: 'Media',
		custom_code: 'Código'
	};
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
						<span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
							{ELEMENT_LABELS[selected.type]}
						</span>
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

				{#if selected.type === 'media'}
					<div class="space-y-4">
						<div>
							<p class="text-xs font-medium text-muted-foreground mb-2">Archivo Media</p>
							<div class="grid grid-cols-2 gap-2">
								<Button variant="outline" size="sm" class="h-8 text-[10px]" onclick={() => fileInputRef?.click()} disabled={uploading}>
									{#if uploading}
										<Loader class="w-3 h-3 mr-1.5 animate-spin" /> Subiendo…
									{:else}
										<ImageIcon class="w-3 h-3 mr-1.5" /> Subir archivo
										{/if}
										</Button>								<Button variant="secondary" size="sm" class="h-8 text-[10px]" onclick={fitToCanvas}>
									<Expand class="w-3 h-3 mr-1.5" /> Fondo total
								</Button>
							</div>
							<input bind:this={fileInputRef} type="file" class="hidden" onchange={onFileInput} />
						</div>

						<div>
							<p class="text-xs font-medium text-muted-foreground mb-2 text-center opacity-50">— O URL directa —</p>
							<Input 
								class="h-8 text-xs font-mono" 
								placeholder="https://... o /api/uploads/..." 
								value={selected.config?.url as string | undefined} 
								oninput={(e) => updateConfig({ url: (e.target as HTMLInputElement).value })} 
							/>
						</div>

						<BackgroundGallery
							currentImage={selected.config?.url as string | undefined}
							onSelect={(url) => updateConfig({ url })}
						/>
					</div>
				{/if}

				{#if selected.type === 'alert'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Evento</p>
						<select
							class="w-full h-8 rounded-md border bg-background px-2 text-xs"
							value={selected.trigger?.event}
							onchange={(e) => onUpdate({ trigger: { ...selected.trigger!, event: (e.target as HTMLSelectElement).value } })}
						>
							{#each ALERT_EVENTS as ev}
								<option value={ev.value}>{ev.label}</option>
							{/each}
						</select>
					</div>
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Filtro usuario (opcional)</p>
						<Input class="h-8 text-xs" placeholder="Broadcaster..." value={selected.trigger?.filter_user} oninput={(e) => onUpdate({ trigger: { ...selected.trigger!, filter_user: (e.target as HTMLInputElement).value } })} />
					</div>
				{/if}

				{#if selected.type === 'stat' || selected.type === 'progress_bar'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Fuente de datos</p>
						<select
							class="w-full h-8 rounded-md border bg-background px-2 text-xs"
							value={selected.data_source}
							onchange={(e) => onUpdate({ data_source: (e.target as HTMLSelectElement).value })}
						>
							{#each STAT_SOURCES as src}
								<option value={src.value}>{src.label}</option>
							{/each}
						</select>
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

				{#if selected.type === 'custom_code'}
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
									value={selected.config?.html as string ?? ''}
									oninput={(e) => updateConfig({ html: (e.target as HTMLTextAreaElement).value })}
									placeholder="<div class='custom'>...</div>"
								></textarea>
							</div>
						{:else if activeTab === 'css'}
							<div>
								<p class="text-[10px] font-medium text-muted-foreground mb-1">Estilos CSS</p>
								<textarea
									class="w-full min-h-[220px] p-2.5 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
									value={selected.config?.css as string ?? ''}
									oninput={(e) => updateConfig({ css: (e.target as HTMLTextAreaElement).value })}
									placeholder={".custom { color: purple; }"}
								></textarea>
							</div>
						{:else if activeTab === 'js'}
							<div>
								<p class="text-[10px] font-medium text-muted-foreground mb-1">Script JavaScript</p>
								<textarea
									class="w-full min-h-[220px] p-2.5 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
									value={selected.config?.js as string ?? ''}
									oninput={(e) => updateConfig({ js: (e.target as HTMLTextAreaElement).value })}
									placeholder={"window.addEventListener('streamupdate', (e) => { ... })"}
								></textarea>
								<p class="text-[9px] text-muted-foreground mt-1 px-1 italic">
									Escuchá <code>streamupdate</code> en window para datos en vivo.
								</p>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Content Template -->
				{#if selected.type !== 'media' && selected.type !== 'custom_code'}
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-tight">Template HTML/Text</p>
						<textarea
							class="w-full min-h-[100px] p-3 rounded-md border bg-background text-xs font-mono focus:ring-1 focus:ring-primary outline-none resize-y"
							value={selected.template}
							oninput={(e) => onUpdate({ template: (e.target as HTMLTextAreaElement).value })}
						></textarea>
						<p class="text-[9px] text-muted-foreground mt-1 px-1 italic">Usa {`{user_name}`}, {`{bits}`}, etc.</p>
					</div>
				{/if}

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
						{#if hasBackground}
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

						{#if hasAccent}
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

						{#if hasTextColor}
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

						{#if hasBorderRadius}
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

						{#if hasFontSize}
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

						{#if hasGlow}
							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Glow</Label>
								<button
									class="text-[10px] px-2.5 py-1 rounded border font-bold transition-colors {selected.style.glow ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-muted-foreground'}"
									onclick={() => updateStyle({ glow: !selected.style.glow })}
								>
									{selected.style.glow ? 'ACTIVO' : 'DESACTIVADO'}
								</button>
							</div>
						{/if}

						<!-- Opacidad (siempre visible para ajustar el desvanecimiento del widget en el layout) -->
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

				<!-- Lista de Capas (Cuando hay elemento seleccionado) -->
				<div class="border-t pt-4">
					<p class="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
						Capas ({elements.length})
					</p>
					<div class="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
						{#each [...elements].reverse() as el}
							{@const Icon = WIDGET_ICONS[el.type] || Layers}
							<button
								class="w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition-all {el.id === selected.id ? 'border-primary bg-primary/10 text-primary-foreground font-semibold' : 'border-transparent bg-card/40 hover:bg-card/90'}"
								onclick={() => onSelect(el.id)}
							>
								<div class="flex items-center gap-1.5 truncate">
									<Icon class="w-3.5 h-3.5 shrink-0 text-primary" />
									<span class="truncate">{ELEMENT_LABELS[el.type] || el.type}</span>
									<span class="text-[9px] opacity-50 font-mono">({el.id})</span>
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
									class="w-full flex items-center justify-between p-2.5 rounded-lg border bg-card/40 hover:bg-primary/5 hover:border-primary/30 transition-all text-left"
									onclick={() => onSelect(el.id)}
								>
									<div class="flex items-center gap-2 truncate">
										<Icon class="w-4 h-4 text-primary shrink-0" />
										<div class="flex flex-col truncate">
											<span class="text-xs font-semibold text-foreground truncate">{ELEMENT_LABELS[el.type] || el.type}</span>
											<span class="text-[9px] text-muted-foreground font-mono truncate">{el.id}</span>
										</div>
									</div>
									<div class="text-[9px] text-muted-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded shrink-0">
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
