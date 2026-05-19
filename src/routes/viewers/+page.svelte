<script lang="ts">
	import { ViewersLeaderboard, ViewerLookup } from '$lib/features/viewers';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Espectadores</h1>
		<p class="text-muted-foreground mt-1">Gestiona y visualiza a los espectadores de tu comunidad.</p>
	</div>
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
		<div class="lg:col-span-4">
			<ViewersLeaderboard />
		</div>
		<div class="lg:col-span-3 flex flex-col gap-6">
			<ViewerLookup />
		</div>
	</div>
</div>
