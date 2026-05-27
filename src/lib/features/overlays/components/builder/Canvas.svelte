<script lang="ts">
	import { Trash2 } from '@lucide/svelte';
	import { WIDGET_REGISTRY } from '../../index';
	import type { OverlayElement, ActiveAlert, ChatMessage } from '../../index';

	let {
		elements,
		selectedId = $bindable(),
		canvasRef = $bindable<HTMLDivElement | null>(null),
		statValues,
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

	const aspectRatio = $derived(`${canvasWidth}/${canvasHeight}`);
	const canvasStyle = $derived(
		`aspect-ratio: ${aspectRatio}; height: min(calc(100% - 0px), calc((100vw - 380px) * ${canvasHeight} / ${canvasWidth})); max-height: 100%;`
	);

	function elStyle(el: OverlayElement): string {
		const isSelected = el.id === selectedId;
		return [
			'position: absolute',
			`left: ${(el.x / canvasWidth) * 100}%`,
			`top: ${(el.y / canvasHeight) * 100}%`,
			`width: ${(el.width / canvasWidth) * 100}%`,
			`height: ${(el.height / canvasHeight) * 100}%`,
			'cursor: move',
			isSelected ? 'outline: 2px solid #9147ff' : 'outline: 1px solid rgba(255,255,255,0.15)',
			'z-index: ' + (isSelected ? '50' : '10'),
			'box-sizing: border-box',
			'user-select: none'
		].join(';');
	}
</script>

<div class="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4 h-full">
	<div
		class="relative bg-black rounded overflow-hidden shadow-2xl"
		style="{canvasStyle}{backgroundImage && backgroundType !== 'video' ? `; background-image: url('${backgroundImage}'); background-size: cover; background-position: center;` : ''}"
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

		<!-- Grid overlay -->
		<div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 10% 10%;"></div>

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
							{statValues}
							{activeAlerts}
							{chatMessages}
						/>
					</div>
				{/if}
				{#if el.id === selectedId}
					<!-- Delete button -->
					<button
						onmousedown={(e) => { e.stopPropagation(); onDeleteSelected(); }}
						class="absolute top-1 right-1 z-20 flex items-center justify-center w-5 h-5 rounded bg-red-600 hover:bg-red-500 transition-colors shadow-md"
						title="Eliminar elemento"
						style="pointer-events: auto;"
					>
						<Trash2 class="w-3 h-3 text-white" />
					</button>

					<!-- Resize handles -->
					{#each HANDLES as h}
						<div
							onmousedown={(e) => { e.stopPropagation(); onStartResize(e, el.id, h.dir); }}
							style="position:absolute;width:8px;height:8px;background:#9147ff;border:1.5px solid #fff;border-radius:2px;z-index:20;pointer-events:auto;cursor:{h.cursor};{h.style}"
							role="presentation"
						></div>
					{/each}
				{/if}
			</div>
		{/each}

		{#if elements.length === 0}
			<div class="absolute inset-0 flex items-center justify-center text-white/30 text-sm font-medium pointer-events-none px-10 text-center">
				Añade elementos desde la toolbar izquierda o pídele a la IA que lo haga por ti
			</div>
		{/if}
	</div>
</div>
