<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { get, put, post } from '$lib/core/api/client';
	import { show } from '$lib/core/stores/toast.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';

	import {
		createOverlayElement,
		computeOverlayNeeds
	} from '$lib/features/overlays';
	import { createOverlayDataSource } from '$lib/features/overlays/dataSource.svelte';
	import type { OverlayElement } from '$lib/features/overlays';

	// Builder components
	import BuilderHeader from '$lib/features/overlays/components/builder/BuilderHeader.svelte';
	import Toolbar from '$lib/features/overlays/components/builder/Toolbar.svelte';
	import Canvas from '$lib/features/overlays/components/builder/Canvas.svelte';
	import PropertyEditor from '$lib/features/overlays/components/builder/PropertyEditor.svelte';

	// ── State ─────────────────────────────────────────────────────────────────
	let overlayName = $state('Cargando...');
	let elements = $state<OverlayElement[]>([]);
	let selectedId = $state<string | null>(null);
	let canvasWidth = $state(1920);
	let canvasHeight = $state(1080);
	let canvasAreaRef = $state<HTMLDivElement | null>(null);
	let saving = $state(false);
	
	const overlayId = $derived(page.params.id);
	const liveUrl = $derived(`${page.url.origin}/overlays/live/${overlayId}`);
	const selected = $derived(elements.find((e) => e.id === selectedId) ?? null);

	// Preview state for the canvas — real live stats (fetched once) preferred over canned samples.
	let liveStatBySource = $state<Record<string, string>>({});

	const ds = createOverlayDataSource('preview', () => elements, {
		getLiveOverrides: () => liveStatBySource
	});

	// ── Actions ───────────────────────────────────────────────────────────────
	let saveTimeout: ReturnType<typeof setTimeout>;
	function scheduleSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(save, 2000);
	}

	async function load() {
		try {
			const res = await get<{ success: boolean; data: { name: string; config: { elements: OverlayElement[]; canvas_width?: number; canvas_height?: number } } }>(
				`/overlays/${overlayId}`
			);
			if (res.success) {
				overlayName = res.data.name;
				elements = res.data.config.elements ?? [];
				canvasWidth = res.data.config.canvas_width ?? 1920;
				canvasHeight = res.data.config.canvas_height ?? 1080;
			}
		} catch {
			show('Error al cargar', 'error');
		}
	}

	async function save(notify = false) {
		saving = true;
		try {
			const res = await put<{ success: boolean; error?: string }>(`/overlays/${overlayId}`, {
				name: overlayName,
				config: {
					elements,
					canvas_width: canvasWidth,
					canvas_height: canvasHeight,
					needs: computeOverlayNeeds(elements)
				}
			});
			
			if (res.success) {
				if (notify) show('Guardado', 'success');
			} else {
				show(res.error ?? 'Error al guardar', 'error');
			}
		} catch (e: any) {
			show(e.message ?? 'Error de conexión', 'error');
		} finally {
			saving = false;
		}
	}

	function addElement(type: OverlayElement['type']) {
		const el = createOverlayElement(type);
		// Center within the configured canvas
		el.x = Math.max(0, Math.round((canvasWidth - el.width) / 2));
		el.y = Math.max(0, Math.round((canvasHeight - el.height) / 2));
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

	function startResize(e: MouseEvent, elId: string, dir: string) {
		e.preventDefault();
		selectedId = elId;
		if (!canvasAreaRef) return;
		const rect = canvasAreaRef.getBoundingClientRect();
		const el = elements.find((el) => el.id === elId)!;
		const startMouseX = e.clientX;
		const startMouseY = e.clientY;
		const startX = el.x, startY = el.y, startW = el.width, startH = el.height;
		const MIN_W = 50, MIN_H = 30;

		function onMove(me: MouseEvent) {
			// DX and DY need to be adjusted by the current scale of the canvas
			const scale = rect.width / canvasWidth;
			const dx = (me.clientX - startMouseX) / scale;
			const dy = (me.clientY - startMouseY) / scale;
			let x = startX, y = startY, w = startW, h = startH;

			if (dir.includes('e')) w = Math.max(MIN_W, startW + dx);
			if (dir.includes('s')) h = Math.max(MIN_H, startH + dy);
			if (dir.includes('w')) { w = Math.max(MIN_W, startW - dx); x = startX + startW - w; }
			if (dir.includes('n')) { h = Math.max(MIN_H, startH - dy); y = startY + startH - h; }

			elements = elements.map((item) =>
				item.id === elId ? { ...item, x, y, width: w, height: h } : item
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

	function startDrag(e: MouseEvent, elId: string) {
		e.preventDefault();
		selectedId = elId;
		if (!canvasAreaRef) return;
		const rect = canvasAreaRef.getBoundingClientRect();
		const el = elements.find((el) => el.id === elId)!;
		const startMouseX = e.clientX;
		const startMouseY = e.clientY;
		const startElX = el.x;
		const startElY = el.y;

		function onMove(me: MouseEvent) {
			const scale = rect.width / canvasWidth;
			const dx = (me.clientX - startMouseX) / scale;
			const dy = (me.clientY - startMouseY) / scale;
			elements = elements.map((item) =>
				item.id === elId
					? {
							...item,
							x: Math.max(0, Math.min(canvasWidth - item.width, startElX + dx)),
							y: Math.max(0, Math.min(canvasHeight - item.height, startElY + dy))
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

	function updateSelected(patch: Partial<OverlayElement>) {
		if (!selectedId) return;
		elements = elements.map((el) => (el.id === selectedId ? { ...el, ...patch } : el));
		scheduleSave();
	}

	function moveLayer(dir: 'up' | 'down' | 'front' | 'back') {
		if (!selectedId) return;
		const idx = elements.findIndex(el => el.id === selectedId);
		if (idx === -1) return;

		let next = [...elements];
		const el = next.splice(idx, 1)[0];

		if (dir === 'up') next.splice(Math.min(elements.length - 1, idx + 1), 0, el);
		else if (dir === 'down') next.splice(Math.max(0, idx - 1), 0, el);
		else if (dir === 'front') next.push(el);
		else if (dir === 'back') next.unshift(el);

		elements = next;
		scheduleSave();
	}

	let showUrlModal = $state(false);

	async function copyLiveUrl() {
		if (navigator.clipboard) {
			try {
				await navigator.clipboard.writeText(liveUrl);
				show('URL copiada', 'success');
				return;
			} catch {}
		}
		showUrlModal = true;
	}

	function onUrlInputMount(node: HTMLInputElement) {
		node.select();
	}

	async function testAlert() {
		const eventType = selected?.trigger?.event ?? elements.find(e => e.type === 'alert')?.trigger?.event ?? 'channel.subscribe';
		try {
			await post('/dashboard/alerts/test', { event_type: eventType });
			show('Test enviado', 'success');
		} catch { show('Error en test', 'error'); }
	}

	onMount(async () => {
		load();
		try {
			const res = await get<{ success: boolean; data: Record<string, any> }>('/overlays/data');
			if (res.success) liveStatBySource = Object.fromEntries(Object.entries(res.data).map(([k,v]) => [k, String(v)]));
		} catch {}
	});
</script>

<div class="flex flex-col h-screen bg-background overflow-hidden">
	<BuilderHeader
		bind:overlayName
		bind:canvasWidth
		bind:canvasHeight
		{saving}
		{liveUrl}
		onSave={() => save(true)}
		onCopyLiveUrl={copyLiveUrl}
		onTestAlert={testAlert}
	/>

	<div class="flex flex-1 overflow-hidden">
		<Toolbar onAdd={addElement} />

		<div class="flex flex-col flex-1 overflow-hidden">
			<div class="flex-1 overflow-hidden canvas-wrapper">
				<Canvas
					{elements}
					bind:selectedId
					bind:canvasRef={canvasAreaRef}
					statValues={ds.statValues}
					activeAlerts={ds.activeAlerts}
					chatMessages={ds.chatMessages}
					{canvasWidth}
					{canvasHeight}
					onStartDrag={startDrag}
					onStartResize={startResize}
					onDeleteSelected={deleteSelected}
				/>
			</div>
		</div>

		<PropertyEditor
			{selected}
			{elements}
			onSelect={(id) => selectedId = id}
			onUpdate={updateSelected}
			onDelete={deleteSelected}
			onDuplicate={duplicateSelected}
			onMoveLayer={moveLayer}
			{canvasWidth}
			{canvasHeight}
		/>
	</div>
</div>

<Dialog.Root bind:open={showUrlModal}>
	<Dialog.Content class="sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title>URL para OBS</Dialog.Title>
			<Dialog.Description>Copia esta URL manualmente (Ctrl+C / Cmd+C):</Dialog.Description>
		</Dialog.Header>
		<input
			class="w-full rounded-md border bg-muted px-3 py-2 text-xs font-mono outline-none focus:ring-1 focus:ring-primary/40 select-all"
			readonly
			value={liveUrl}
			use:onUrlInputMount
		/>
		<Dialog.Footer>
			<Button variant="ghost" onclick={() => (showUrlModal = false)}>Cerrar</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
