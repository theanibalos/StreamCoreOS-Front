<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import EventLibrary from '../editors/EventLibrary.svelte';
	import { BookOpen } from '@lucide/svelte';

	let {
		open = $bindable(false),
		onInsertSnippet
	}: {
		open: boolean;
		onInsertSnippet?: (snippet: { html?: string; css?: string; js?: string }) => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-5xl max-w-5xl w-[94vw] h-[88vh] flex flex-col p-0 overflow-hidden bg-background border-border">
		<Dialog.Header class="px-6 py-4 border-b bg-card/60 shrink-0">
			<div class="flex items-center gap-2.5">
				<div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
					<BookOpen class="w-4 h-4" />
				</div>
				<div>
					<Dialog.Title class="text-base font-semibold">Librería de Inyección de Eventos en Vivo</Dialog.Title>
					<Dialog.Description class="text-xs text-muted-foreground mt-0.5">
						Guía y fragmentos de código para inyectar y filtrar chat de YouTube, Twitch, Super Chats, alertas y estadísticas en tus widgets.
					</Dialog.Description>
				</div>
			</div>
		</Dialog.Header>

		<div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
			<EventLibrary {onInsertSnippet} />
		</div>

		<Dialog.Footer class="px-6 py-3 border-t bg-card/40 shrink-0">
			<Button variant="ghost" size="sm" onclick={() => open = false}>Cerrar</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 5px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 9999px;
	}
</style>
