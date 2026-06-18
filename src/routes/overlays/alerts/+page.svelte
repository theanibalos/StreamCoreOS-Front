<script lang="ts">
	import { alerts } from '$lib/features/chat';
	import { fade, fly, scale } from 'svelte/transition';
	import { Heart, Star, Users, Zap } from '@lucide/svelte';

	let currentAlert = $state<any>(null);
	let queue = $state<any[]>([]);
	let isDisplaying = $state(false);
	let lastProcessedId = $state(0);

	// Detectar nuevas alertas
	$effect(() => {
		const allItems = alerts.items;
		if (allItems.length === 0) return;
		
		// Filtrar solo las alertas que no hemos procesado aún
		const newItems = allItems.filter(item => item._id > lastProcessedId);
		
		if (newItems.length > 0) {
			queue = [...queue, ...newItems];
			lastProcessedId = Math.max(...newItems.map(i => i._id));
			processQueue();
		}
	});

	async function processQueue() {
		if (isDisplaying || queue.length === 0) return;
		
		isDisplaying = true;
		currentAlert = queue[0];
		queue = queue.slice(1);

		// Mostrar la alerta por 5 segundos
		await new Promise(r => setTimeout(r, 5000));
		
		currentAlert = null;
		await new Promise(r => setTimeout(r, 1000)); // Pausa entre alertas
		isDisplaying = false;
		processQueue();
	}

	const icons = {
		follow: Heart,
		sub: Star,
		raid: Users,
		default: Zap
	};

	function getIcon(type: string = '') {
		const t = type.toLowerCase();
		if (t.includes('follow')) return icons.follow;
		if (t.includes('sub')) return icons.sub;
		if (t.includes('raid')) return icons.raid;
		return icons.default;
	}

	function getTitle(type: string = '') {
		const t = type.toLowerCase();
		if (t.includes('follow')) return 'NUEVO SEGUIDOR';
		if (t.includes('sub')) return 'NUEVO SUSCRIPTOR';
		if (t.includes('raid')) return '¡RAID!';
		return 'ALERTA';
	}
</script>

<div class="flex items-center justify-center h-screen w-screen overflow-hidden bg-transparent">
	{#if currentAlert}
		{@const Icon = getIcon(currentAlert.type)}
		<div 
			in:scale={{ start: 0.8, duration: 400 }}
			out:fade={{ duration: 200 }}
			class="flex flex-col items-center gap-4 bg-black/90 backdrop-blur-xl p-10 rounded-[3rem] border-4 border-primary shadow-[0_0_80px_rgba(var(--primary-rgb),0.4)] pointer-events-none"
		>
			<div class="bg-primary p-8 rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.6)]">
				<Icon class="w-16 h-16 text-white fill-white" />
			</div>
			
			<div class="text-center">
				<h2 class="text-primary font-black text-2xl tracking-[0.3em] mb-2 uppercase">{getTitle(currentAlert.type)}</h2>
				<p class="text-white text-5xl font-extrabold tracking-tight">
					{currentAlert.data?.display_name ?? currentAlert.data?.user_name ?? 'Alguien'}
				</p>
			</div>

			{#if currentAlert.data?.message}
				<p class="text-white/90 italic text-xl max-w-lg text-center mt-4 font-medium leading-snug">
					"{currentAlert.data.message}"
				</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	:global(:root) {
		--primary-rgb: 147, 51, 234; /* Violet-600 */
	}
	:global(html.overlay-page-html), :global(body.overlay-page-body) {
		background: transparent !important;
		background-color: transparent !important;
		color-scheme: normal !important;
	}
</style>
