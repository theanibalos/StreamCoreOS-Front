<script lang="ts">
	import { TwitchPermissions } from '$lib/features/auth';
	import { OverlayFeedToken } from '$lib/features/overlays';
	import { Card, CardHeader, CardTitle, CardContent } from '$lib/components/ui/card';
	import { toggleMode } from 'mode-watcher';
	import { Sun, Moon, Palette } from '@lucide/svelte';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Configuración</h1>
		<p class="text-muted-foreground mt-1">Permisos y configuración global del sistema.</p>
	</div>

	<Card class="w-full">
		<CardHeader class="border-b pb-4">
			<CardTitle class="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
				<Palette class="w-4 h-4" /> Apariencia
			</CardTitle>
		</CardHeader>
		<CardContent class="pt-6">
			<button
				onclick={toggleMode}
				class="flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm font-medium hover:bg-muted/60 transition-all"
			>
				<span class="relative flex h-4 w-4 items-center justify-center shrink-0">
					<Sun class="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
				</span>
				<span class="dark:hidden">Modo claro</span>
				<span class="hidden dark:inline">Modo oscuro</span>
			</button>
		</CardContent>
	</Card>

	<OverlayFeedToken />

	<TwitchPermissions />
</div>
