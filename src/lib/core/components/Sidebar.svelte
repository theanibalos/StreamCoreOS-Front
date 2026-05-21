<script lang="ts">
	import { page } from '$app/state';
	import { FEATURES } from '../features.config';
	import { Button } from '$lib/components/ui/button';
	import { Sun, Moon } from '@lucide/svelte';
	import { toggleMode } from 'mode-watcher';
	import { logout } from '$lib/core/stores/auth.svelte';

	let { class: className = '' }: { class?: string } = $props();
</script>

<nav class="flex flex-col border-r bg-card/50 px-3 py-4 {className}">
	<div class="mb-6 px-4 flex items-center justify-between">
		<h2 class="text-xl font-bold tracking-tight text-primary">StreamCoreOS</h2>
		<Button variant="ghost" size="icon" onclick={toggleMode} class="h-8 w-8">
			<Sun class="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon class="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span class="sr-only">Toggle theme</span>
		</Button>
	</div>

	<ul class="space-y-1 flex-1 px-1">
		{#each FEATURES as link (link.href)}
			<li>
				<a
					href={link.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all {
						page.url.pathname === link.href || (link.href !== '/' && page.url.pathname.startsWith(link.href))
						? 'bg-primary/10 text-primary shadow-sm'
						: 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
					}"
				>
					<link.icon class="h-4.5 w-4.5 flex-shrink-0" />
					{link.label}
				</a>
			</li>
		{/each}
	</ul>

	<div class="mt-auto pt-4 border-t px-2 space-y-2">
		<button
			onclick={logout}
			class="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all group"
		>
			<span class="text-base group-hover:scale-110 transition-transform">🔌</span> 
			Desconectar Twitch
		</button>
	</div>
</nav>
