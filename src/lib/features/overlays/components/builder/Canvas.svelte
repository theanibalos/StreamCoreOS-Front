<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { WIDGET_REGISTRY } from '../../index';
	import type { OverlayElement, ActiveAlert, ChatMessage } from '../../index';
	import { onMount } from 'svelte';

	let {
		elements,
		selectedId = $bindable(),
		canvasRef = $bindable<HTMLDivElement | null>(null),
		statValues,
		globalStats = {},
		activeAlerts,
		chatMessages,
		canvasWidth = 1920,
		canvasHeight = 1080,
		backgroundImage = null,
		backgroundType = null,
		onStartDrag,
		onStartResize,
		onDeleteSelected
	}: {
		elements: OverlayElement[];
		selectedId: string | null;
		canvasRef?: HTMLDivElement | null;
		statValues: Record<string, string>;
		globalStats?: Record<string, string>;
		activeAlerts: ActiveAlert[];
		chatMessages: Record<string, ChatMessage[]>;
		canvasWidth?: number;
		canvasHeight?: number;
		backgroundImage?: string | null;
		backgroundType?: 'image' | 'video' | null;
		onStartDrag: (e: MouseEvent, id: string) => void;
		onStartResize: (e: MouseEvent, id: string, dir: string) => void;
		onDeleteSelected: () => void;
	} = $props();

	type Handle = { dir: string; style: string; cursor: string };
	const HANDLES: Handle[] = [
		{ dir: 'nw', style: 'top:0;left:0;transform:translate(-50%,-50%)',    cursor: 'nw-resize' },
		{ dir: 'n',  style: 'top:0;left:50%;transform:translate(-50%,-50%)',  cursor: 'ns-resize' },
		{ dir: 'ne', style: 'top:0;right:0;transform:translate(50%,-50%)',    cursor: 'ne-resize' },
		{ dir: 'e',  style: 'top:50%;right:0;transform:translate(50%,-50%)',  cursor: 'ew-resize' },
		{ dir: 'se', style: 'bottom:0;right:0;transform:translate(50%,50%)',  cursor: 'se-resize' },
		{ dir: 's',  style: 'bottom:0;left:50%;transform:translate(-50%,50%)','cursor': 'ns-resize' },
		{ dir: 'sw', style: 'bottom:0;left:0;transform:translate(-50%,50%)',  cursor: 'sw-resize' },
		{ dir: 'w',  style: 'top:50%;left:0;transform:translate(-50%,-50%)',  cursor: 'ew-resize' },
	];

	let containerRef = $state<HTMLDivElement | null>(null);
	let scale = $state(1);

	function updateScale() {
		if (containerRef) {
			const containerWidth = containerRef.clientWidth;
			const containerHeight = containerRef.clientHeight;
			// We want to fit the canvasWidth x canvasHeight inside the container
			scale = Math.min(
				containerWidth / canvasWidth,
				containerHeight / canvasHeight
			) * 0.95; // 0.95 to leave a small margin
		}
	}

	onMount(() => {
		updateScale();
		const observer = new ResizeObserver(updateScale);
		if (containerRef) observer.observe(containerRef);
		return () => observer.disconnect();
	});

	function elStyle(el: OverlayElement): string {
		const isSelected = el.id === selectedId;
		return [
			'position: absolute',
			`left: ${el.x}px`,
			`top: ${el.y}px`,
			`width: ${el.width}px`,
			`height: ${el.height}px`,
			'cursor: move',
			isSelected ? 'outline: 4px solid #9147ff' : 'outline: 1px solid rgba(255,255,255,0.3)',
			'z-index: ' + (isSelected ? '50' : '10'),
			'box-sizing: border-box',
			'user-select: none'
		].join(';');
	}
</script>

<div class="flex-1 overflow-hidden bg-muted/30 flex items-center justify-center p-4 h-full" bind:this={containerRef}>
	<!-- Scaled Canvas Container -->
	<div 
		style="
			width: {canvasWidth}px; 
			height: {canvasHeight}px; 
			transform: scale({scale}); 
			transform-origin: center;
			flex-shrink: 0;
		"
		class="relative bg-black shadow-2xl overflow-hidden"
		bind:this={canvasRef}
		onmousedown={(e) => { if (e.target === e.currentTarget) selectedId = null; }}
		role="presentation"
	>
		<!-- Video background -->
		{#if backgroundImage && backgroundType === 'video'}
			<video
				src={backgroundImage}
				autoplay loop muted playsinline
				class="absolute inset-0 w-full h-full object-cover pointer-events-none"
				style="z-index: 0;"
			></video>
		{/if}

		{#if backgroundImage && backgroundType !== 'video'}
			<div class="absolute inset-0 bg-cover bg-center" style="background-image: url('{backgroundImage}'); z-index: 0;"></div>
		{/if}

		<!-- Grid overlay -->
		<div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 50px 50px; z-index: 1;"></div>

		{#each elements as el (el.id)}
			{@const Widget = WIDGET_REGISTRY[el.type]}
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				style={elStyle(el)}
				onmousedown={(e) => onStartDrag(e, el.id)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Delete' && selectedId === el.id && onDeleteSelected()}
			>
				{#if Widget}
					<div style="pointer-events: none; width: 100%; height: 100%;">
						<Widget
							element={el}
							statValues={el.type === 'custom_code' ? globalStats : statValues}
							{activeAlerts}
							{chatMessages}
						/>
					</div>
				{/if}
				{#if el.id === selectedId}
					<!-- Delete button -->
					<button
						onmousedown={(e) => { e.stopPropagation(); onDeleteSelected(); }}
						class="absolute top-2 right-2 z-20 flex items-center justify-center w-8 h-8 rounded bg-red-600 hover:bg-red-500 transition-colors shadow-md"
						title="Eliminar elemento"
						style="pointer-events: auto;"
					>
						<Trash2 class="w-5 h-5 text-white" />
					</button>

					<!-- Resize handles -->
					{#each HANDLES as h}
						<div
							onmousedown={(e) => { e.stopPropagation(); onStartResize(e, el.id, h.dir); }}
							style="position:absolute;width:12px;height:12px;background:#9147ff;border:2px solid #fff;border-radius:3px;z-index:20;pointer-events:auto;cursor:{h.cursor};{h.style}"
							role="presentation"
						></div>
					{/each}
				{/if}
			</div>
		{/each}

		{#if elements.length === 0}
			<div class="absolute inset-0 flex items-center justify-center text-white/30 text-4xl font-medium pointer-events-none px-20 text-center">
				Añade elementos desde la barra lateral
			</div>
		{/if}
	</div>
</div>
