<script lang="ts">
	import { post } from '$lib/core/api/client';
	import type { BanResponse, TimeoutResponse, UnbanResponse } from '$lib/types/api';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Loader2, ShieldX, Clock, UserCheck, Hammer } from '@lucide/svelte';

	type ActionType = 'timeout' | 'ban' | 'unban';

	let activeTab = $state<ActionType>('timeout');
	let twitchId = $state('');
	let reason = $state('');
	let duration = $state(600);
	let submitting = $state(false);
	let result = $state<{ ok: boolean; msg: string } | null>(null);

	async function submit() {
		const id = twitchId.trim();
		if (!id) return;
		submitting = true;
		result = null;
		try {
			if (activeTab === 'ban') {
				const res = await post<BanResponse>('/moderation/ban', {
					twitch_id: id,
					reason: reason.trim() || undefined
				});
				result = { ok: res.success, msg: res.success ? `Usuario ${id} baneado.` : (res.error ?? 'Fallo al banear.') };
			} else if (activeTab === 'timeout') {
				const res = await post<TimeoutResponse>('/moderation/timeout', {
					twitch_id: id,
					duration_s: duration,
					reason: reason.trim() || undefined
				});
				result = {
					ok: res.success,
					msg: res.success ? `Timeout de ${duration}s aplicado a ${id}.` : (res.error ?? 'Fallo al aplicar timeout.')
				};
			} else {
				const res = await post<UnbanResponse>('/moderation/unban', { twitch_id: id });
				result = { ok: res.success, msg: res.success ? `Usuario ${id} desbaneado.` : (res.error ?? 'Fallo al desbanear.') };
			}
			if (result.ok) {
				twitchId = '';
				reason = '';
			}
		} catch (e) {
			result = { ok: false, msg: e instanceof Error ? e.message : String(e) };
		} finally {
			submitting = false;
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') submit();
	}

	function onTabChange(v: string | undefined) {
		if (v) {
			activeTab = v as ActionType;
			result = null;
		}
	}
</script>

<Card class="w-full shadow-lg border-2 border-primary/10">
	<CardHeader class="bg-muted/30 pb-4">
		<CardTitle class="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
			<Hammer class="w-4 h-4 text-primary" /> Martillo de Mod
		</CardTitle>
		<CardDescription class="text-[10px]">Acciones rápidas sobre usuarios específicos.</CardDescription>
	</CardHeader>
	<CardContent class="p-8">
		<Tabs value={activeTab} onValueChange={onTabChange} class="w-full">
			<TabsList class="grid w-full grid-cols-3 mb-8 bg-muted/50 p-1.5 h-12">
				<TabsTrigger value="timeout" class="text-[11px] font-bold uppercase tracking-wider h-9">
					<Clock class="w-4 h-4 mr-2" /> Timeout
				</TabsTrigger>
				<TabsTrigger value="ban" class="text-[11px] font-bold uppercase tracking-wider h-9 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
					<ShieldX class="w-4 h-4 mr-2" /> Ban
				</TabsTrigger>
				<TabsTrigger value="unban" class="text-[11px] font-bold uppercase tracking-wider h-9 data-[state=active]:bg-green-600 data-[state=active]:text-white">
					<UserCheck class="w-4 h-4 mr-2" /> Unban
				</TabsTrigger>
			</TabsList>

			<div class="flex flex-col gap-6">
				<div class="grid gap-2.5">
					<label for="twitchId" class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground flex items-center gap-2">
						<span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
						ID de Usuario o Login
					</label>
					<Input id="twitchId" placeholder="Ej: anibalos" bind:value={twitchId} onkeydown={onKeydown} class="h-12 bg-muted/20 border-primary/10 focus:border-primary text-base px-4" />
				</div>

				{#if activeTab !== 'unban'}
					<div class="grid gap-2.5">
						<label for="reason" class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground">Motivo <span class="opacity-40 normal-case">(opcional)</span></label>
						<Input id="reason" placeholder="Spam, insultos..." bind:value={reason} onkeydown={onKeydown} class="h-12 bg-muted/20 border-primary/10 focus:border-primary px-4" />
					</div>
				{/if}

				{#if activeTab === 'timeout'}
					<div class="grid gap-3">
						<label for="duration" class="text-[11px] font-black uppercase tracking-[0.1em] text-muted-foreground">Duración en segundos</label>
						<div class="flex gap-2">
							<Input id="duration" type="number" min="1" max="1209600" bind:value={duration} class="h-12 bg-muted/20 border-primary/10 focus:border-primary flex-1" />
						</div>
						<div class="flex flex-wrap gap-2">
							{#each [60, 600, 3600, 86400] as s}
								<Button variant="outline" size="sm" class="h-8 text-[10px] font-bold px-3 border-primary/5 hover:border-primary/40" onclick={() => duration = s}>
									{s >= 86400 ? '1d' : (s >= 3600 ? s/3600 + 'h' : (s >= 60 ? s/60 + 'm' : s + 's'))}
								</Button>
							{/each}
						</div>
					</div>
				{/if}

				{#if result}
					<div class="p-4 rounded-xl text-[12px] font-bold animate-in fade-in slide-in-from-bottom-2 duration-300 {result.ok ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}">
						<div class="flex items-center gap-2">
							<div class="w-1.5 h-1.5 rounded-full {result.ok ? 'bg-green-500' : 'bg-destructive'}"></div>
							{result.msg}
						</div>
					</div>
				{/if}
			</div>
		</Tabs>
	</CardContent>
	<CardFooter class="bg-muted/30 p-6 border-t">
		<Button 
			variant={activeTab === 'ban' ? 'destructive' : (activeTab === 'timeout' ? 'default' : 'secondary')} 
			onclick={submit} 
			disabled={submitting || !twitchId.trim()}
			class="w-full h-12 font-black uppercase tracking-[0.2em] text-xs shadow-lg shadow-primary/5"
		>
			{#if submitting}
				<Loader2 class="mr-2 h-5 w-5 animate-spin" />
				PROCESANDO...
			{:else}
				{activeTab === 'ban' ? 'EJECUTAR BAN' : (activeTab === 'timeout' ? 'APLICAR TIMEOUT' : 'CONFIRMAR UNBAN')}
			{/if}
		</Button>
	</CardFooter>
</Card>
