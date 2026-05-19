<script lang="ts">
	import { StreamStatus } from '$lib/features/dashboard';
	import { AlertFeed } from '$lib/features/chat';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Panel de Control</h1>
		<p class="text-muted-foreground">Bienvenido al panel de control de tu stream.</p>
	</div>
	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
		<StreamStatus />
		<AlertFeed />
	</div>
</div>
