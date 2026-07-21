<script lang="ts">
	import { page } from '$app/state';
	import { FEATURES } from '../features.config';
	import { Link, Link2Off } from '@lucide/svelte';
	import { logout, auth } from '$lib/core/stores/auth.svelte';
	import logoIcon from '$lib/assets/favicon.svg';

	let { class: className = '' }: { class?: string } = $props();
</script>

<nav class="flex flex-col border-r bg-card/50 px-3 py-4 {className}">
	<div class="mb-6 px-4 flex items-center gap-2">
		<img src={logoIcon} alt="" class="h-7 w-7" />
		<h2 class="text-xl font-bold tracking-tight text-primary">StreamCoreOS</h2>
	</div>

	<div class="px-4 mb-6">
		<div class="flex items-center gap-2 rounded-md border bg-muted/40 p-2 shadow-inner">
			<div class="relative flex h-2 w-2">
				{#if auth.isConnected}
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
				{:else if auth.isConnecting}
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
				{:else}
					<span class="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
				{/if}
			</div>
			<div class="flex flex-col">
				<span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">Twitch EventSub</span>
				<span class="text-[11px] font-semibold">
					{#if auth.isConnected}
						<span class="text-emerald-500 dark:text-emerald-400">En línea</span>
					{:else if auth.isConnecting}
						<span class="text-amber-500 dark:text-amber-400 animate-pulse">Conectando...</span>
					{:else}
						<span class="text-destructive">Desconectado</span>
					{/if}
				</span>
			</div>
		</div>
	</div>

	<ul class="space-y-1 flex-1 px-1">
		{#each FEATURES as link (link.href)}
			<li>
				<a
					href={link.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all {
						page.url.pathname === link.href || (link.href !== '/' && link.href !== '/settings' && page.url.pathname.startsWith(link.href))
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
