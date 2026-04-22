<script lang="ts">
	import { ModerationRules } from '$lib/features/moderation';
	import { ModLog } from '$lib/features/moderation';
	import { ManualActions } from '$lib/features/dashboard';
</script>

<div class="flex flex-col gap-8 w-full max-w-[1600px] mx-auto">
	<div class="flex flex-col gap-1">
		<h1 class="text-3xl font-bold tracking-tight">Moderación</h1>
		<p class="text-muted-foreground">Control total sobre el chat: filtros automáticos, acciones manuales y registros.</p>
	</div>

	<div class="flex flex-col gap-8">
		<ModerationRules />
		
		<div class="grid grid-cols-1 xl:grid-cols-5 gap-8">
			<div class="xl:col-span-2">
				<ManualActions />
			</div>
			<div class="xl:col-span-3">
				<ModLog />
			</div>
		</div>
	</div>
</div>
