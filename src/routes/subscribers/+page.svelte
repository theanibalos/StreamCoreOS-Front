<script lang="ts">
	import { SubscribersLeaderboard, BitsLeaderboard, GiftersLeaderboard } from '$lib/features/subscribers';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Suscriptores</h1>
		<p class="text-muted-foreground mt-1">Leaderboard de subs, gifters y bits de tu comunidad.</p>
	</div>
	<div class="grid gap-6 lg:grid-cols-3">
		<div class="lg:col-span-2">
			<SubscribersLeaderboard />
		</div>
		<div class="flex flex-col gap-6">
			<GiftersLeaderboard />
			<BitsLeaderboard />
		</div>
	</div>
</div>
