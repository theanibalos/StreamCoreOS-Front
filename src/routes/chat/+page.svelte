<script lang="ts">
	import { ChatViewer } from '$lib/features/chat';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Chat & Comunidad</h1>
		<p class="text-muted-foreground mt-1">Monitor de mensajes en vivo y eventos del stream.</p>
	</div>
	
	<div class="w-full">
		<ChatViewer />
	</div>
</div>
