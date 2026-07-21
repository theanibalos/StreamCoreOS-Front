<script lang="ts">
	import { SystemHealth } from '$lib/features/system';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Estado del Sistema</h1>
		<p class="text-muted-foreground mt-1">Monitor de salud y recursos del microkernel.</p>
	</div>
	<div class="grid gap-6">
		<SystemHealth />
	</div>
</div>
