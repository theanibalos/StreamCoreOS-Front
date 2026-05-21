<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { startTwitchAuth, auth } from '$lib/core/stores/auth.svelte';

	let { error = null }: { error?: string | null } = $props();
</script>

<div class="flex flex-1 items-center justify-center bg-background p-4">
	<Card class="w-full max-w-md shadow-lg border-primary/10">
		<CardHeader class="text-center pb-2">
			<div class="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
				<span class="text-2xl">⚡</span>
			</div>
			<CardTitle class="text-3xl font-extrabold text-primary mb-1">StreamCoreOS</CardTitle>
			<CardDescription class="text-sm">Controla tu stream con facilidad y potencia</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-5 pt-4">
			<p class="text-sm text-muted-foreground text-center px-2">
				Inicia sesión con tu cuenta de Twitch para acceder a tu panel personalizado.
			</p>
			
			{#if error || auth.error}
				<div class="rounded-lg bg-destructive/10 p-3.5 text-xs text-destructive border border-destructive/20 flex gap-3 items-start">
					<span class="text-base mt-0.5">⚠️</span>
					<div class="flex-1 font-medium">{error || auth.error}</div>
				</div>
			{/if}
			
			<Button 
				onclick={startTwitchAuth} 
				class="w-full bg-[#9146ff] hover:bg-[#772ce8] text-white h-11 font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
			>
				<span class="mr-2.5 text-lg">🟣</span> Iniciar sesión con Twitch
			</Button>

			<div class="text-[10px] text-center text-muted-foreground/60 px-6">
				Al iniciar sesión, aceptas que StreamCoreOS acceda a los datos necesarios para gestionar tu stream.
			</div>
		</CardContent>
	</Card>
</div>
