<script lang="ts">
	import { TwitchPermissions } from '$lib/features/auth';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Configuración</h1>
		<p class="text-muted-foreground mt-1">Permisos y configuración global del sistema.</p>
	</div>

	<TwitchPermissions />
</div>
