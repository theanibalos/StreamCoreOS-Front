<script lang="ts">
	import { onMount } from 'svelte';
	import { connectTTS, tts } from '$lib/features/chat';
	import { Volume2 } from '@lucide/svelte';

	onMount(() => {
		const stop = connectTTS();
		return () => {
			stop();
		};
	});
</script>

<div class="flex items-center justify-center h-screen w-screen bg-transparent p-10">
	<div class="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl transition-opacity duration-500 {tts.connected ? 'opacity-100' : 'opacity-50'}">
		<div class="relative">
			<Volume2 class="w-12 h-12 {tts.connected ? 'text-primary' : 'text-muted-foreground'}" />
			{#if tts.connected}
				<span class="absolute -top-1 -right-1 flex h-4 w-4">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-black"></span>
				</span>
			{/if}
		</div>

		<div class="text-center">
			<p class="text-white font-black text-[10px] tracking-[0.2em] uppercase">TTS Engine</p>
			<p class="text-xs {tts.connected ? 'text-green-400 font-bold' : 'text-red-400'}">
				{tts.connected ? 'EN LÍNEA' : 'SIN CONEXIÓN'}
			</p>
		</div>

		{#if tts.currentSpeaker}
			<div class="flex items-center gap-2 bg-black/40 rounded-full px-4 py-1.5 mt-1 border border-white/10">
				<span class="text-base">🔊</span>
				<span class="text-white text-sm font-semibold">{tts.currentSpeaker}</span>
			</div>
		{/if}

		{#if !tts.connected}
			<p class="text-[9px] text-white/40 max-w-[120px] text-center leading-tight mt-2 italic">
				Esperando conexión con el backend...
			</p>
		{/if}
	</div>
</div>

<style>
	:global(html.overlay-page-html), :global(body.overlay-page-body) {
		background: transparent !important;
		background-color: transparent !important;
		color-scheme: normal !important;
	}
</style>
