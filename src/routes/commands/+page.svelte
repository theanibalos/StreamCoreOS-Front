<script lang="ts">
	import { CommandsManager } from '$lib/features/commands';
	import { ChatReminders } from '$lib/features/chat';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Comandos</h1>
		<p class="text-muted-foreground mt-1">Crea, edita y gestiona comandos personalizados y recordatorios.</p>
	</div>

	<div class="flex flex-col gap-6">
		<CommandsManager />
		<ChatReminders />
	</div>
</div>
