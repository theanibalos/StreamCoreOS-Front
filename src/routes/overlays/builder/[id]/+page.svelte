<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { get, put, post } from '$lib/core/api/client';
	import { show } from '$lib/core/stores/toast.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import {
		Layers,
		MessageSquare,
		Zap,
		BarChart2,
		Type,
		Trash2,
		Save,
		Sparkles,
		Send,
		GripVertical,
		Copy,
		ExternalLink,
		TrendingUp,
		ArrowLeft
	} from '@lucide/svelte';

	const overlayId = $derived(page.params.id);

	// ── Types ─────────────────────────────────────────────────────────────────
	type ElementStyle = {
		background: string;
		accent: string;
		border_radius: number;
		glow: boolean;
		duration_ms: number;
		animation: 'scale_in' | 'fade_in' | 'slide_up' | 'slide_down';
		font_size: number;
		text_color: string;
	};

	type OverlayElement = {
		id: string;
		type: 'alert' | 'stat' | 'chat_highlight' | 'banner' | 'progress_bar';
		x: number;
		y: number;
		width: number;
		height: number;
		trigger: { event: string; filter_user?: string | null } | null;
		data_source?: string | null;
		config?: Record<string, unknown>;
		style: ElementStyle;
		template: string;
	};

	type AiMessage = { role: 'user' | 'assistant'; content: string };

	// ── State ─────────────────────────────────────────────────────────────────
	let overlayName = $state('Cargando...');
	let elements = $state<OverlayElement[]>([]);
	let selectedId = $state<string | null>(null);
	let aiMessages = $state<AiMessage[]>([]);
	let aiInput = $state('');
	let aiLoading = $state(false);
	let saving = $state(false);
	let canvasRef = $state<HTMLDivElement | null>(null);

	// ── Auto-save ─────────────────────────────────────────────────────────────
	let _saveTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleSave() {
		if (_saveTimer) clearTimeout(_saveTimer);
		_saveTimer = setTimeout(async () => {
			try {
				saving = true;
				await put(`/overlays/${overlayId}`, { name: overlayName, config: { elements } });
			} catch {
				show('Error al guardar', 'error');
			} finally {
				saving = false;
			}
		}, 600);
	}

	const selected = $derived(elements.find((e) => e.id === selectedId) ?? null);
	const liveUrl = $derived(typeof window !== 'undefined' ? `${window.location.origin}/overlays/live/${overlayId}` : '');

	// ── Load ──────────────────────────────────────────────────────────────────
	async function load() {
		try {
			const res = await get<{ success: boolean; data: { name: string; config: { elements: OverlayElement[] } } }>(
				`/overlays/${overlayId}`
			);
			if (res.success) {
				overlayName = res.data.name;
				elements = res.data.config.elements ?? [];
			}
		} catch (e) {
			show('Error al cargar el overlay', 'error');
		}
	}

	// ── Save ──────────────────────────────────────────────────────────────────
	async function save() {
		saving = true;
		try {
			await put(`/overlays/${overlayId}`, { name: overlayName, config: { elements } });
			show('Guardado', 'success');
		} catch {
			show('Error al guardar', 'error');
		} finally {
			saving = false;
		}
	}

	// ── Add element ───────────────────────────────────────────────────────────
	function addElement(type: OverlayElement['type']) {
		const defaults: Record<OverlayElement['type'], Partial<OverlayElement>> = {
			alert: {
				width: 420, height: 160,
				x: 750, y: 460,
				trigger: { event: 'channel.subscribe', filter_user: null },
				template: '¡{user_name} se suscribió! 🎉',
				style: { background: '#000000cc', accent: '#9333ea', border_radius: 20, glow: true, duration_ms: 5000, animation: 'scale_in', font_size: 28, text_color: '#ffffff' }
			},
			stat: {
				width: 220, height: 60,
				x: 20, y: 20,
				trigger: null,
				data_source: 'stream.viewer_count',
				template: '👁 {value}',
				style: { background: '#000000aa', accent: '#9333ea', border_radius: 12, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 22, text_color: '#ffffff' }
			},
			chat_highlight: {
				width: 380, height: 500,
				x: 1500, y: 60,
				trigger: { event: 'chat.message', filter_user: null },
				template: '{display_name}: {message}',
				style: { background: '#000000bb', accent: '#9333ea', border_radius: 14, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 18, text_color: '#ffffff' }
			},
			banner: {
				width: 500, height: 70,
				x: 710, y: 980,
				trigger: null,
				template: 'Mi Stream',
				style: { background: '#000000cc', accent: '#9333ea', border_radius: 10, glow: false, duration_ms: 0, animation: 'fade_in', font_size: 24, text_color: '#ffffff' }
			},
			progress_bar: {
				width: 700, height: 90,
				x: 110, y: 950,
				trigger: null,
				data_source: 'subscribers.active_total',
				template: '',
				config: { label: 'Meta de subs', target: 500, show_count: true, show_percentage: false },
				style: { background: '#18181bcc', accent: '#9147ff', border_radius: 14, glow: true, duration_ms: 0, animation: 'fade_in', font_size: 20, text_color: '#ffffff' }
			}
		};

		const el: OverlayElement = {
			id: Math.random().toString(36).slice(2, 9),
			type,
			x: 0, y: 0, width: 400, height: 150,
			trigger: null, template: '', data_source: null,
			style: { background: '#000000cc', accent: '#9333ea', border_radius: 16, glow: false, duration_ms: 5000, animation: 'scale_in', font_size: 24, text_color: '#ffffff' },
			...defaults[type]
		} as OverlayElement;

		elements = [...elements, el];
		selectedId = el.id;
		scheduleSave();
	}

	function deleteSelected() {
		if (!selectedId) return;
		elements = elements.filter((e) => e.id !== selectedId);
		selectedId = null;
		scheduleSave();
	}

	function duplicateSelected() {
		if (!selected) return;
		const copy: OverlayElement = {
			...JSON.parse(JSON.stringify(selected)),
			id: Math.random().toString(36).slice(2, 9),
			x: selected.x + 20,
			y: selected.y + 20
		};
		elements = [...elements, copy];
		selectedId = copy.id;
		scheduleSave();
	}

	// ── Drag to move ──────────────────────────────────────────────────────────
	function startDrag(e: MouseEvent, elId: string) {
		e.preventDefault();
		e.stopPropagation();
		selectedId = elId;

		const canvas = canvasRef;
		if (!canvas) return;
		const rect = canvas.getBoundingClientRect();

		const el = elements.find((el) => el.id === elId)!;
		const startMouseX = e.clientX;
		const startMouseY = e.clientY;
		const startElX = el.x;
		const startElY = el.y;

		function onMove(e: MouseEvent) {
			const dx = ((e.clientX - startMouseX) / rect.width) * 1920;
			const dy = ((e.clientY - startMouseY) / rect.height) * 1080;
			elements = elements.map((item) =>
				item.id === elId
					? {
							...item,
							x: Math.max(0, Math.min(1920 - item.width, startElX + dx)),
							y: Math.max(0, Math.min(1080 - item.height, startElY + dy))
						}
					: item
			);
		}

		function onUp() {
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
			scheduleSave();
		}

		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}

	// ── Update selected element field ─────────────────────────────────────────
	function updateEl(patch: Partial<OverlayElement>) {
		if (!selectedId) return;
		elements = elements.map((el) => (el.id === selectedId ? { ...el, ...patch } : el));
		scheduleSave();
	}

	function updateStyle(patch: Partial<ElementStyle>) {
		if (!selectedId) return;
		elements = elements.map((el) =>
			el.id === selectedId ? { ...el, style: { ...el.style, ...patch } } : el
		);
		scheduleSave();
	}

	function updateTrigger(patch: Partial<{ event: string; filter_user: string | null }>) {
		if (!selected) return;
		const current = selected.trigger ?? { event: 'channel.subscribe', filter_user: null };
		updateEl({ trigger: { ...current, ...patch } });
		// scheduleSave already called inside updateEl
	}

	// ── AI assistant ──────────────────────────────────────────────────────────
	async function sendToAi() {
		const msg = aiInput.trim();
		if (!msg || aiLoading) return;
		aiInput = '';
		aiLoading = true;
		aiMessages = [...aiMessages, { role: 'user', content: msg }];

		try {
			const currentConfig = selected
				? { elements: [selected] }
				: { elements };

			const description = selected
				? `Modifica SOLO el elemento con id "${selected.id}": ${msg}`
				: msg;

			const res = await post<{ success: boolean; data: { elements: OverlayElement[] }; error?: string }>(
				'/overlays/generate',
				{ description, current_config: currentConfig }
			);

			if (!res.success) throw new Error(res.error ?? 'Error desconocido');

			const generated = res.data.elements ?? [];

			if (selected) {
				// Replace only the modified element
				elements = elements.map((el) => {
					const updated = generated.find((g) => g.id === el.id);
					return updated ?? el;
				});
			} else {
				// Merge: keep existing + add new
				const existingIds = new Set(elements.map((e) => e.id));
				const newEls = generated.filter((g) => !existingIds.has(g.id));
				const updatedEls = elements.map((el) => {
					const updated = generated.find((g) => g.id === el.id);
					return updated ?? el;
				});
				elements = [...updatedEls, ...newEls];
			}

			aiMessages = [
				...aiMessages,
				{ role: 'assistant', content: `Listo. ${generated.length} elemento(s) generado(s)/actualizado(s).` }
			];
			scheduleSave();
		} catch (e: any) {
			aiMessages = [...aiMessages, { role: 'assistant', content: `Error: ${e.message}` }];
		} finally {
			aiLoading = false;
		}
	}

	// ── Helpers ───────────────────────────────────────────────────────────────
	function elStyle(el: OverlayElement): string {
		const s = el.style;
		const isSelected = el.id === selectedId;
		return [
			`position: absolute`,
			`left: ${(el.x / 1920) * 100}%`,
			`top: ${(el.y / 1080) * 100}%`,
			`width: ${(el.width / 1920) * 100}%`,
			`height: ${(el.height / 1080) * 100}%`,
			`background: ${s.background}`,
			`border-radius: ${s.border_radius}px`,
			`border: 2px solid ${isSelected ? s.accent : s.accent + '44'}`,
			`box-shadow: ${isSelected ? `0 0 0 2px ${s.accent}, 0 0 20px ${s.accent}44` : 'none'}`,
			`cursor: grab`,
			`display: flex`,
			`align-items: center`,
			`justify-content: center`,
			`color: ${s.text_color}`,
			`font-size: clamp(8px, ${(s.font_size / 1080) * 100}vh, ${s.font_size}px)`,
			`font-weight: 700`,
			`padding: 8px`,
			`overflow: hidden`,
			`user-select: none`
		].join(';');
	}

	const ELEMENT_LABELS: Record<string, string> = {
		alert:          'Alert',
		stat:           'Stat',
		chat_highlight: 'Chat',
		banner:         'Banner',
		progress_bar:   'Progreso'
	};

	import type { Component } from 'svelte';
	type ToolbarItem = { type: OverlayElement['type']; icon: Component; label: string };
	const TOOLBAR_ITEMS: ToolbarItem[] = [
		{ type: 'alert',          icon: Zap,          label: 'Alert'    },
		{ type: 'stat',           icon: BarChart2,     label: 'Stat'     },
		{ type: 'chat_highlight', icon: MessageSquare, label: 'Chat'     },
		{ type: 'banner',         icon: Type,          label: 'Banner'   },
		{ type: 'progress_bar',   icon: TrendingUp,    label: 'Progreso' }
	];

	const EVENTS = [
		{ value: 'channel.follow', label: 'Nuevo seguidor' },
		{ value: 'channel.subscribe', label: 'Suscripción' },
		{ value: 'channel.subscription.gift', label: 'Sub gifteada' },
		{ value: 'channel.cheer', label: 'Bits' },
		{ value: 'channel.raid', label: 'Raid' },
		{ value: 'chat.message', label: 'Mensaje de chat' }
	];

	// Data sources available from GET /overlays/data (public backend endpoint)
	// Each entry describes what value is returned and what {variable} to use in templates
	const DATA_SOURCES: { value: string; label: string; hint: string; example: string }[] = [
		{
			value: 'subscribers.active_total',
			label: 'Subs activos',
			hint: 'COUNT de subs activos en la DB local. Se actualiza al recibir eventos de sub/unsub.',
			example: '423'
		},
		{
			value: 'bits.total',
			label: 'Bits totales',
			hint: 'SUM de todos los bits acumulados en la DB local desde siempre.',
			example: '15420'
		},
		{
			value: 'stream.online',
			label: 'Stream online',
			hint: 'true/false — si el stream está actualmente en vivo.',
			example: 'true'
		}
	];

	// Template variables available per element type and trigger
	const TEMPLATE_VARS: Record<string, { var: string; desc: string }[]> = {
		follow:              [{ var: '{user_name}', desc: 'Nombre del nuevo seguidor' }],
		subscribe:           [{ var: '{user_name}', desc: 'Nombre del sub' }, { var: '{tier}', desc: 'Tier (1000/2000/3000)' }, { var: '{message}', desc: 'Mensaje de resub' }],
		'subscription.gift': [{ var: '{user_name}', desc: 'Quien gifteó' }, { var: '{total}', desc: 'Total de gifts' }],
		cheer:               [{ var: '{user_name}', desc: 'Quien mandó bits' }, { var: '{bits}', desc: 'Cantidad de bits' }],
		raid:                [{ var: '{user_name}', desc: 'Canal que raidea' }, { var: '{viewers}', desc: 'Espectadores del raid' }],
		chat:                [{ var: '{display_name}', desc: 'Nombre del usuario' }, { var: '{message}', desc: 'Mensaje del chat' }],
		stat:                [{ var: '{value}', desc: 'Valor de la fuente de datos' }],
	};

	function getTemplateVars(el: OverlayElement): { var: string; desc: string }[] {
		if (el.type === 'stat') return TEMPLATE_VARS.stat;
		if (el.type === 'chat_highlight') return TEMPLATE_VARS.chat;
		if (!el.trigger?.event) return [];
		const key = Object.keys(TEMPLATE_VARS).find((k) => el.trigger!.event.includes(k));
		return key ? TEMPLATE_VARS[key] : [];
	}

	function updateConfig(patch: Record<string, unknown>) {
		if (!selectedId) return;
		elements = elements.map((el) =>
			el.id === selectedId ? { ...el, config: { ...(el.config ?? {}), ...patch } } : el
		);
		scheduleSave();
	}

	const ANIMATIONS = [
		{ value: 'scale_in', label: 'Scale In' },
		{ value: 'fade_in', label: 'Fade In' },
		{ value: 'slide_up', label: 'Slide Up' },
		{ value: 'slide_down', label: 'Slide Down' }
	];

	function copyLiveUrl() {
		navigator.clipboard.writeText(liveUrl);
		show('URL copiada', 'success');
	}

	onMount(load);
</script>

<div class="flex flex-col h-screen bg-background overflow-hidden">
	<!-- Top bar -->
	<div class="flex items-center gap-3 px-4 py-2 border-b bg-card shrink-0">
		<Button variant="ghost" size="sm" href="/overlays" class="shrink-0 -ml-1">
			<ArrowLeft class="w-4 h-4 mr-1" /> Overlays
		</Button>
		<div class="w-px h-5 bg-border"></div>
		<Layers class="w-4 h-4 text-primary shrink-0" />
		<input
			class="font-semibold bg-transparent border-none outline-none text-sm flex-1 min-w-0"
			bind:value={overlayName}
			onblur={save}
		/>
		<div class="flex items-center gap-2 ml-auto">
			<Button variant="outline" size="sm" onclick={copyLiveUrl}>
				<Copy class="w-3.5 h-3.5 mr-1.5" /> URL OBS
			</Button>
			<Button variant="outline" size="sm" href={`${liveUrl}?preview=1`} target="_blank">
				<ExternalLink class="w-3.5 h-3.5 mr-1.5" /> Preview
			</Button>
			<Button size="sm" onclick={save} disabled={saving}>
				<Save class="w-3.5 h-3.5 mr-1.5" /> {saving ? 'Guardando…' : 'Guardar'}
			</Button>
		</div>
	</div>

	<div class="flex flex-1 overflow-hidden">
		<!-- Left: element toolbar -->
		<div class="w-14 border-r bg-card flex flex-col items-center py-3 gap-2 shrink-0">
			{#each TOOLBAR_ITEMS as item}
				<button
					class="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors w-full"
					onclick={() => addElement(item.type)}
					title={item.label}
				>
					<item.icon class="w-5 h-5" />
					<span class="text-[9px] font-medium">{item.label}</span>
				</button>
			{/each}
		</div>

		<!-- Center: canvas + AI bar -->
		<div class="flex flex-col flex-1 overflow-hidden">
			<!-- Canvas -->
			<div class="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
				<div
					class="relative bg-black rounded overflow-hidden shadow-2xl"
					style="aspect-ratio: 1920/1080; height: min(calc(100% - 0px), calc((100vw - 380px) * 9 / 16)); max-height: 100%;"
					bind:this={canvasRef}
					onmousedown={(e) => { if (e.target === e.currentTarget) selectedId = null; }}
					role="presentation"
				>
					<!-- Grid overlay -->
					<div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 10% 10%;"></div>

					{#each elements as el (el.id)}
						<div
							style={elStyle(el)}
							onmousedown={(e) => startDrag(e, el.id)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Delete' && selectedId === el.id && deleteSelected()}
						>
							<div class="flex flex-col items-center gap-0.5 pointer-events-none w-full overflow-hidden">
								<span class="opacity-50 text-[0.5em] uppercase tracking-widest font-mono">
									{ELEMENT_LABELS[el.type]}
								</span>
								<span class="text-[0.6em] truncate w-full text-center px-1 leading-tight">
									{el.template || el.data_source || '—'}
								</span>
							</div>
							{#if el.id === selectedId}
								<GripVertical class="absolute top-1 right-1 w-3 h-3 opacity-40" />
							{/if}
						</div>
					{/each}

					{#if elements.length === 0}
						<div class="absolute inset-0 flex items-center justify-center text-white/30 text-sm font-medium pointer-events-none">
							Añade elementos desde la toolbar izquierda o pídele a la IA
						</div>
					{/if}
				</div>
			</div>

			<!-- AI chat bar -->
			<div class="border-t bg-card shrink-0">
				{#if aiMessages.length > 0}
					<div class="px-4 py-2 max-h-32 overflow-y-auto flex flex-col gap-1.5 border-b">
						{#each aiMessages as msg}
							<div class="flex gap-2 text-sm {msg.role === 'user' ? 'justify-end' : 'justify-start'}">
								<span class="px-3 py-1.5 rounded-xl max-w-[70%] {msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}">
									{msg.content}
								</span>
							</div>
						{/each}
					</div>
				{/if}
				<div class="flex items-center gap-2 px-4 py-2">
					<Sparkles class="w-4 h-4 text-primary shrink-0" />
					<input
						class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
						placeholder={selected ? `Modificar elemento "${ELEMENT_LABELS[selected.type]}"… ej: "hacelo más grande y con glow azul"` : 'Describí qué overlay querés… ej: "alert de subs en la esquina derecha con glow purple"'}
						bind:value={aiInput}
						onkeydown={(e) => e.key === 'Enter' && sendToAi()}
						disabled={aiLoading}
					/>
					<Button size="sm" variant="ghost" onclick={sendToAi} disabled={aiLoading || !aiInput.trim()}>
						{#if aiLoading}
							<span class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
						{:else}
							<Send class="w-4 h-4" />
						{/if}
					</Button>
				</div>
			</div>
		</div>

		<!-- Right: properties panel -->
		<div class="w-72 border-l bg-card overflow-y-auto shrink-0">
			{#if selected}
				<div class="p-4 flex flex-col gap-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold">{ELEMENT_LABELS[selected.type]}</span>
						<div class="flex gap-1">
							<Button variant="ghost" size="sm" onclick={duplicateSelected} title="Duplicar">
								<Copy class="w-3.5 h-3.5" />
							</Button>
							<Button variant="ghost" size="sm" onclick={deleteSelected} title="Eliminar">
								<Trash2 class="w-3.5 h-3.5 text-destructive" />
							</Button>
						</div>
					</div>

					<!-- Position & Size -->
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Posición y tamaño</p>
						<div class="grid grid-cols-2 gap-2">
							{#each [['X', 'x', 0, 1920], ['Y', 'y', 0, 1080], ['W', 'width', 50, 1920], ['H', 'height', 30, 1080]] as [label, key, min, max]}
								<div>
									<Label class="text-[10px] text-muted-foreground">{label}</Label>
									<Input
										type="number"
										{min}
										{max}
										class="h-7 text-xs"
										value={selected[key as keyof OverlayElement] as number}
										oninput={(e) => updateEl({ [key]: parseInt((e.target as HTMLInputElement).value) || 0 })}
									/>
								</div>
							{/each}
						</div>
					</div>

					<!-- Trigger (for alert and chat_highlight) -->
					{#if selected.type === 'alert' || selected.type === 'chat_highlight'}
						<div>
							<p class="text-xs font-medium text-muted-foreground mb-2">Trigger</p>
							<select
								class="w-full h-8 rounded-md border bg-background px-2 text-xs"
								value={selected.trigger?.event ?? ''}
								onchange={(e) => updateTrigger({ event: (e.target as HTMLSelectElement).value })}
							>
								{#each EVENTS as ev}
									<option value={ev.value}>{ev.label}</option>
								{/each}
							</select>
							{#if selected.trigger?.event === 'chat.message'}
								<div class="mt-2">
									<Label class="text-[10px] text-muted-foreground">Filtrar usuario (vacío = todos)</Label>
									<Input
										class="h-7 text-xs mt-1"
										value={selected.trigger?.filter_user ?? ''}
										oninput={(e) => updateTrigger({ filter_user: (e.target as HTMLInputElement).value || null })}
									/>
								</div>
							{/if}
						</div>
					{/if}

					<!-- Data source (for stat) -->
					{#if selected.type === 'stat'}
						{@const currentDs = DATA_SOURCES.find(d => d.value === selected.data_source)}
						<div>
							<p class="text-xs font-medium text-muted-foreground mb-2">Fuente de datos</p>
							<select
								class="w-full h-8 rounded-md border bg-background px-2 text-xs"
								value={selected.data_source ?? ''}
								onchange={(e) => updateEl({ data_source: (e.target as HTMLSelectElement).value })}
							>
								{#each DATA_SOURCES as ds}
									<option value={ds.value}>{ds.label}</option>
								{/each}
							</select>
							{#if currentDs}
								<p class="text-[10px] text-muted-foreground mt-1.5 leading-snug">{currentDs.hint}</p>
								<p class="text-[10px] text-primary/70 mt-0.5">Valor ejemplo: <code>{currentDs.example}</code> → usá <code>{'{value}'}</code> en el template</p>
							{/if}
						</div>
					{/if}

					<!-- Progress bar config -->
					{#if selected.type === 'progress_bar'}
						{@const pbDs = DATA_SOURCES.find(d => d.value === selected.data_source)}
						<div class="flex flex-col gap-3">
							<p class="text-xs font-semibold text-muted-foreground">Barra de progreso</p>

							<div>
								<Label class="text-[10px] text-muted-foreground">Fuente de datos</Label>
								<select
									class="w-full h-8 rounded-md border bg-background px-2 text-xs mt-1"
									value={selected.data_source ?? ''}
									onchange={(e) => updateEl({ data_source: (e.target as HTMLSelectElement).value })}
								>
									{#each DATA_SOURCES as ds}
										<option value={ds.value}>{ds.label}</option>
									{/each}
								</select>
								{#if pbDs}
									<p class="text-[10px] text-muted-foreground mt-1.5 leading-snug">{pbDs.hint}</p>
								{/if}
							</div>

							<div>
								<Label class="text-[10px] text-muted-foreground">Label (título)</Label>
								<Input
									class="h-7 text-xs mt-1"
									value={String(selected.config?.label ?? '')}
									oninput={(e) => updateConfig({ label: (e.target as HTMLInputElement).value })}
								/>
							</div>

							<div>
								<Label class="text-[10px] text-muted-foreground">Meta (target)</Label>
								<Input
									type="number" min="1"
									class="h-7 text-xs mt-1"
									value={Number(selected.config?.target ?? 100)}
									oninput={(e) => updateConfig({ target: parseInt((e.target as HTMLInputElement).value) || 100 })}
								/>
							</div>

							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Mostrar conteo</Label>
								<button
									class="text-xs px-2 py-0.5 rounded border {selected.config?.show_count !== false ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border'}"
									onclick={() => updateConfig({ show_count: !(selected.config?.show_count !== false) })}
								>
									{selected.config?.show_count !== false ? 'On' : 'Off'}
								</button>
							</div>

							<div class="flex items-center justify-between">
								<Label class="text-[10px] text-muted-foreground">Mostrar %</Label>
								<button
									class="text-xs px-2 py-0.5 rounded border {selected.config?.show_percentage ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border'}"
									onclick={() => updateConfig({ show_percentage: !selected.config?.show_percentage })}
								>
									{selected.config?.show_percentage ? 'On' : 'Off'}
								</button>
							</div>
						</div>
					{/if}

					<!-- Template (not for progress_bar) -->
					{#if selected.type !== 'progress_bar'}
						{@const vars = getTemplateVars(selected)}
						<div>
							<p class="text-xs font-medium text-muted-foreground mb-2">Template</p>
							<textarea
								class="w-full rounded-md border bg-background px-3 py-2 text-xs resize-none font-mono"
								rows="2"
								value={selected.template}
								oninput={(e) => updateEl({ template: (e.target as HTMLTextAreaElement).value })}
							></textarea>

							{#if vars.length > 0}
								<div class="mt-2 flex flex-col gap-1">
									<p class="text-[10px] font-medium text-muted-foreground">Variables disponibles:</p>
									{#each vars as v}
										<button
											class="flex items-baseline gap-2 text-left hover:bg-muted/50 rounded px-1 py-0.5 group"
											onclick={() => updateEl({ template: selected.template + v.var })}
											title="Click para insertar"
										>
											<code class="text-[10px] text-primary font-mono group-hover:underline">{v.var}</code>
											<span class="text-[10px] text-muted-foreground">{v.desc}</span>
										</button>
									{/each}
								</div>
							{:else}
								<p class="text-[10px] text-muted-foreground mt-1">Sin variables para este tipo.</p>
							{/if}
						</div>
					{/if}

					<!-- Duration (alerts only) -->
					{#if selected.type === 'alert'}
						<div>
							<Label class="text-[10px] text-muted-foreground">Duración (ms)</Label>
							<Input
								type="number"
								min="1000"
								max="30000"
								class="h-7 text-xs mt-1"
								value={selected.style.duration_ms}
								oninput={(e) => updateStyle({ duration_ms: parseInt((e.target as HTMLInputElement).value) || 5000 })}
							/>
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

					<!-- Style -->
					<div>
						<p class="text-xs font-medium text-muted-foreground mb-2">Estilo</p>
						<div class="flex flex-col gap-2">
							{#each [['Fondo', 'background'], ['Acento', 'accent'], ['Color texto', 'text_color']] as [label, key]}
								<div class="flex items-center justify-between">
									<Label class="text-[10px] text-muted-foreground">{label}</Label>
									<div class="flex items-center gap-1.5">
										<input
											type="color"
											value={(selected.style as Record<string, any>)[key]?.replace(/[0-9a-f]{2}$/i, '') ?? '#000000'}
											class="w-6 h-6 rounded cursor-pointer border-0 p-0"
											onchange={(e) => updateStyle({ [key]: (e.target as HTMLInputElement).value } as Partial<ElementStyle>)}
										/>
										<Input
											class="h-6 w-24 text-[10px] font-mono"
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
									class="text-xs px-2 py-0.5 rounded border {selected.style.glow ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border'}"
									onclick={() => updateStyle({ glow: !selected.style.glow })}
								>
									{selected.style.glow ? 'On' : 'Off'}
								</button>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-sm p-6 gap-3">
					<Layers class="w-8 h-8 opacity-30" />
					<p class="text-xs">Seleccioná un elemento en el canvas para editar sus propiedades</p>
				</div>
			{/if}
		</div>
	</div>
</div>
