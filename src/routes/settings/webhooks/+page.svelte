<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, del, put } from '$lib/core/api/client';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import { 
		Webhook, 
		Plus, 
		Trash2, 
		Play, 
		Settings2, 
		CheckCircle2, 
		XCircle,
		Filter,
		RefreshCw,
		AlertCircle
	} from '@lucide/svelte';

	interface Webhook {
		id: number;
		name: string;
		url: string;
		method: string;
		trigger_type: 'command' | 'event';
		trigger_value: string;
		filter_field?: string;
		filter_value?: string;
		body_template?: string;
		enabled: boolean;
	}

	let webhooks = $state<Webhook[]>([]);
	let loading = $state(true);
	let isDialogOpen = $state(false);
	let editingId = $state<number | null>(null);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let isTesting = $state<number | null>(null);
	let testResult = $state<{id: number, success: boolean, msg: string} | null>(null);
	let selectedEventPreset = $state('');

	const EVENT_PRESETS = [
		{ value: 'stream.session.started', label: 'Directo Online (stream.session.started)' },
		{ value: 'stream.session.ended', label: 'Directo Offline (stream.session.ended)' },
		{ value: 'channel.follow', label: 'Nuevo Seguidor (channel.follow)' },
		{ value: 'subscriber.new', label: 'Nueva Suscripción (subscriber.new)' },
		{ value: 'subscriber.resub', label: 'Renovación de Suscripción (subscriber.resub)' },
		{ value: 'subscriber.gift', label: 'Suscripción Regalada (subscriber.gift)' },
		{ value: 'viewer.bits.received', label: 'Donación de Bits (viewer.bits.received)' },
		{ value: 'channel.channel_points_custom_reward_redemption.add', label: 'Canje de Puntos de Canal (redemption)' },
		{ value: 'channel.raid', label: 'Raid Recibido (channel.raid)' },
		{ value: 'chat.message.received', label: 'Mensaje de Chat (chat.message.received)' },
		{ value: 'custom', label: 'Otro Evento (Personalizado...)' }
	];

	// Form state
	let form = $state({
		name: '',
		url: '',
		method: 'POST',
		trigger_type: 'event' as 'command' | 'event',
		trigger_value: '',
		filter_field: '',
		filter_value: '',
		body_template: '',
		enabled: true
	});

	async function loadWebhooks() {
		loading = true;
		try {
			const res = await get<{success: boolean, data: Webhook[]}>('/webhooks');
			if (res.success) webhooks = res.data;
		} finally {
			loading = false;
		}
	}

	async function saveWebhook() {
		isSaving = true;
		saveError = null;
		try {
			const url = editingId ? `/webhooks/${editingId}` : '/webhooks';
			
			// Procesar campos vacíos a nulos
			const processedData = { ...form };
			if (!processedData.filter_field) processedData.filter_field = '';
			if (!processedData.filter_value) processedData.filter_value = '';

			const res = editingId 
				? await put<{success: boolean, error?: string}>(url, processedData)
				: await post<{success: boolean, error?: string}>(url, processedData);

			if (res.success) {
				isDialogOpen = false;
				loadWebhooks();
				resetForm();
			} else {
				saveError = res.error || 'Error desconocido al guardar';
			}
		} catch (e: any) {
			saveError = e.message;
		} finally {
			isSaving = false;
		}
	}

	async function deleteWebhook(id: number) {
		if (!confirm('¿Estás seguro de eliminar este webhook?')) return;
		try {
			await del(`/webhooks/${id}`);
			loadWebhooks();
		} catch (e) {
			console.error(e);
		}
	}

	async function toggleWebhook(wh: Webhook) {
		try {
			const res = await put<{success: boolean, error?: string}>(`/webhooks/${wh.id}`, { enabled: !wh.enabled });
			if (res.success) {
				loadWebhooks();
			} else {
				alert('Error al cambiar estado: ' + res.error);
			}
		} catch (e: any) {
			alert('Error de red: ' + e.message);
		}
	}

	async function testWebhook(wh: Webhook) {
		isTesting = wh.id;
		testResult = null;
		try {
			const res = await post<any>('/webhooks/test', {
				url: wh.url,
				method: wh.method,
				body_template: wh.body_template || '{}'
			});
			testResult = {
				id: wh.id,
				success: res.success,
				msg: res.success ? '¡Exito!' : (res.error || 'Error')
			};
		} catch (e: any) {
			testResult = { id: wh.id, success: false, msg: e.message };
		} finally {
			isTesting = null;
		}
	}

	function resetForm() {
		form = {
			name: '',
			url: '',
			method: 'POST',
			trigger_type: 'event',
			trigger_value: '',
			filter_field: '',
			filter_value: '',
			body_template: '',
			enabled: true
		};
		selectedEventPreset = '';
		editingId = null;
		saveError = null;
	}

	function openEditDialog(wh: Webhook) {
		editingId = wh.id;
		form = {
			name: wh.name,
			url: wh.url,
			method: wh.method,
			trigger_type: wh.trigger_type,
			trigger_value: wh.trigger_value,
			filter_field: wh.filter_field || '',
			filter_value: wh.filter_value || '',
			body_template: wh.body_template || '',
			enabled: wh.enabled
		};
		if (wh.trigger_type === 'event') {
			const isPreset = EVENT_PRESETS.some(p => p.value === wh.trigger_value);
			selectedEventPreset = isPreset ? wh.trigger_value : 'custom';
		} else {
			selectedEventPreset = '';
		}
		isDialogOpen = true;
	}

	onMount(loadWebhooks);
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold tracking-tight flex items-center gap-3">
				<Webhook class="w-8 h-8 text-primary" /> Webhooks
			</h1>
			<p class="text-muted-foreground mt-1">Automatizaciones externas (Home Assistant, Discord, etc).</p>
		</div>
		
		<Dialog.Root bind:open={isDialogOpen}>
			<Dialog.Trigger>
				<Button class="gap-2" onclick={resetForm}>
					<Plus class="w-4 h-4" /> Nuevo Webhook
				</Button>
			</Dialog.Trigger>
			<Dialog.Content class="sm:max-w-[500px]">
				<Dialog.Header>
					<Dialog.Title>{editingId ? 'Editar Webhook' : 'Configurar Webhook'}</Dialog.Title>
					<Dialog.Description>
						{editingId ? 'Modifica los parámetros de tu automatización.' : 'Envía una petición HTTP cuando ocurra algo en tu stream.'}
					</Dialog.Description>
				</Dialog.Header>
				
				<div class="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
					{#if saveError}
						<div class="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs flex gap-2 items-center">
							<AlertCircle class="w-4 h-4" />
							{saveError}
						</div>
					{/if}

					<div class="grid gap-2">
						<Label for="name">Nombre</Label>
						<Input id="name" bind:value={form.name} placeholder="Ej: Luces Hack the Planet" />
					</div>
					
					<div class="grid grid-cols-4 gap-2">
						<div class="col-span-1">
							<Label>Método</Label>
							<select bind:value={form.method} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
								<option value="POST">POST</option>
								<option value="GET">GET</option>
							</select>
						</div>
						<div class="col-span-3">
							<Label for="url">URL de Destino</Label>
							<Input id="url" bind:value={form.url} placeholder="https://..." />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="grid gap-2">
							<Label for="type">Tipo de Disparador</Label>
							<select bind:value={form.trigger_type} class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
								<option value="event">Evento</option>
								<option value="command">Comando</option>
							</select>
						</div>
						<div class="grid gap-2">
							<Label for="value">Valor</Label>
							{#if form.trigger_type === 'event'}
								<select 
									bind:value={selectedEventPreset} 
									onchange={(e) => {
										const val = (e.target as HTMLSelectElement).value;
										if (val !== 'custom') {
											form.trigger_value = val;
										} else {
											form.trigger_value = '';
										}
									}}
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								>
									<option value="" disabled selected>Selecciona un evento...</option>
									{#each EVENT_PRESETS as preset}
										<option value={preset.value}>{preset.label}</option>
									{/each}
								</select>
								{#if selectedEventPreset === 'custom'}
									<div class="mt-1">
										<Input id="value" bind:value={form.trigger_value} placeholder="ej: mi.evento.personalizado" />
									</div>
								{/if}
							{:else}
								<Input id="value" bind:value={form.trigger_value} placeholder="ej: !luces" />
							{/if}
						</div>
					</div>

					<!-- Filtro Avanzado -->
					<div class="p-3 bg-primary/5 rounded-lg border border-primary/10">
						<div class="flex items-center gap-2 mb-3">
							<Filter class="w-3.5 h-3.5 text-primary" />
							<span class="text-xs font-bold uppercase tracking-wider">Filtro Inteligente (Opcional)</span>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="grid gap-1.5">
								<Label class="text-[10px]">Campo a vigilar</Label>
								<select bind:value={form.filter_field} class="flex h-8 w-full rounded border bg-background px-2 text-[11px]">
									<option value="">Ninguno (disparar siempre)</option>
									<option value="reward_title">Título de Recompensa</option>
									<option value="user_name">Nombre de Usuario</option>
									<option value="tier">Nivel de Sub (1000, 2000...)</option>
								</select>
							</div>
							<div class="grid gap-1.5">
								<Label class="text-[10px]">Valor exacto</Label>
								<Input bind:value={form.filter_value} class="h-8 text-[11px]" placeholder="Ej: Hack the Planet" />
							</div>
						</div>
					</div>

					{#if form.method === 'POST'}
						<div class="grid gap-2">
							<div class="flex items-center justify-between">
								<Label for="body">Cuerpo JSON (Opcional)</Label>
								<div class="flex flex-wrap gap-1 justify-end max-w-[250px]">
									{#each ['{display_name}', '{reward_title}', '{user_input}', '{bits}'] as v}
										<button type="button" onclick={() => form.body_template += v} class="text-[8px] px-1.5 py-0.5 rounded bg-secondary hover:bg-primary hover:text-white transition-colors">
											{v}
										</button>
									{/each}
								</div>
							</div>
							<textarea bind:value={form.body_template} class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono" placeholder={'{}'}></textarea>
						</div>
					{/if}
				</div>

				<Dialog.Footer>
					<Button variant="outline" onclick={() => isDialogOpen = false} disabled={isSaving}>Cancelar</Button>
					<Button onclick={saveWebhook} disabled={isSaving}>
						{isSaving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}
					</Button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	</div>

	{#if loading}
		<div class="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
			<RefreshCw class="w-10 h-10 animate-spin mb-4 opacity-20" />
			<p>Cargando webhooks...</p>
		</div>
	{:else if webhooks.length === 0}
		<Card class="border-dashed py-20">
			<CardContent class="text-center">
				<Webhook class="w-12 h-12 text-muted-foreground mx-auto mb-4" />
				<h3 class="text-lg font-semibold">No hay webhooks configurados</h3>
				<p class="text-muted-foreground text-sm mt-1">Crea tu primera automatización para conectar con servicios externos.</p>
			</CardContent>
		</Card>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{#each webhooks as wh (wh.id)}
				<Card class="overflow-hidden {wh.enabled ? '' : 'opacity-60 grayscale-[0.5]'} transition-all">
					<CardHeader class="pb-3">
						<div class="flex items-start justify-between">
							<div class="flex flex-col gap-1">
								<div class="flex items-center gap-2">
									<span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary">{wh.trigger_type}</span>
									<span class="text-[9px] font-mono text-muted-foreground truncate max-w-[100px]">{wh.trigger_value}</span>
								</div>
								<CardTitle class="text-lg leading-none mt-1">{wh.name}</CardTitle>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-[10px] font-bold uppercase tracking-wider {wh.enabled ? 'text-emerald-500' : 'text-muted-foreground/50'}">
									{wh.enabled ? 'Activo' : 'Pausado'}
								</span>
								<button 
									onclick={() => toggleWebhook(wh)} 
									class="w-10 h-5 rounded-full relative transition-all shadow-inner {wh.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/30'}"
									title={wh.enabled ? 'Pausar automatización' : 'Activar automatización'}
								>
									<div class="absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm {wh.enabled ? 'translate-x-5' : ''}"></div>
								</button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{#if wh.filter_field}
							<div class="flex items-center gap-1.5 mb-3 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-600 dark:text-amber-400 font-bold italic">
								<Filter class="w-3 h-3" /> Solo si {wh.filter_field} == "{wh.filter_value}"
							</div>
						{/if}

						<div class="flex items-center justify-between gap-2">
							<div class="flex gap-1">
								<Button variant="outline" size="icon" class="h-7 w-7" onclick={() => testWebhook(wh)} disabled={isTesting === wh.id}>
									<Play class="w-3 h-3 {isTesting === wh.id ? 'animate-spin' : ''}" />
								</Button>
								<Button variant="outline" size="icon" class="h-7 w-7" onclick={() => openEditDialog(wh)}>
									<Settings2 class="w-3 h-3" />
								</Button>
							</div>
							
							{#if testResult && testResult.id === wh.id}
								<span class="text-[10px] font-bold {testResult.success ? 'text-emerald-500' : 'text-destructive'}">{testResult.msg}</span>
							{/if}

							<Button variant="ghost" size="icon" class="h-7 w-7 text-muted-foreground hover:text-destructive" onclick={() => deleteWebhook(wh.id)}>
								<Trash2 class="w-3 h-3" />
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{/if}
</div>
