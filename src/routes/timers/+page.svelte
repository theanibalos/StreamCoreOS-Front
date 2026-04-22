<script lang="ts">
	import { TimersManager } from '$lib/features/timers';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Temporizadores</h1>
		<p class="text-muted-foreground mt-1">Configura mensajes automáticos basados en tiempo o cantidad de mensajes en el chat.</p>
	</div>
	<div class="grid gap-6">
		<TimersManager />
	</div>
</div>
