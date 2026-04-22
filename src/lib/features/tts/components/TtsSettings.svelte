<script lang="ts">
	import { onMount } from 'svelte';
	import { get, put } from '$lib/core/api/client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Loader2 } from '@lucide/svelte';

	interface TtsSettingsData {
		enabled:            boolean;
		default_voice:      string;
		max_message_length: number;
		skip_commands:      boolean;
		skip_links:         boolean;
		sub_only:           boolean;
		mod_bypass:         boolean;
		cooldown_seconds:   number;
		blocked_words:      string[];
		redemption_title:   string;
		providers:          Record<string, boolean>;
		updated_at:         string;
	}

	let settings   = $state<TtsSettingsData | null>(null);
	let loading    = $state(true);
	let saving     = $state(false);
	let success    = $state(false);
	let error      = $state<string | null>(null);
	let newWord    = $state('');

	onMount(async () => {
		await loadSettings();
		loading = false;
	});

	async function loadSettings() {
		const res = await get<{ success: boolean; data: TtsSettingsData }>('/tts/settings');
		if (res.success && res.data) settings = res.data;
	}

	async function save() {
		if (!settings) return;
		saving = true;
		error  = null;
		try {
			const res = await put<{ success: boolean; data: TtsSettingsData; error?: string }>(
				'/tts/settings',
				{
					enabled:            settings.enabled,
					default_voice:      settings.default_voice,
					max_message_length: settings.max_message_length,
					skip_commands:      settings.skip_commands,
					skip_links:         settings.skip_links,
					sub_only:           settings.sub_only,
					mod_bypass:         settings.mod_bypass,
					cooldown_seconds:   settings.cooldown_seconds,
					blocked_words:      settings.blocked_words,
					redemption_title:   settings.redemption_title
				}
			);
			if (res.success && res.data) {
				settings = res.data;
				success  = true;
				setTimeout(() => (success = false), 2500);
			} else {
				error = res.error ?? 'Error al guardar';
			}
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Error desconocido';
		} finally {
			saving = false;
		}
	}

	function addWord() {
		const w = newWord.trim().toLowerCase();
		if (!w || !settings) return;
		if (!settings.blocked_words.includes(w)) {
			settings.blocked_words = [...settings.blocked_words, w];
		}
		newWord = '';
	}

	function removeWord(w: string) {
		if (!settings) return;
		settings.blocked_words = settings.blocked_words.filter((x) => x !== w);
	}
</script>

<div class="flex flex-col gap-6 w-full">
	{#if loading}
		<div class="flex items-center gap-2 text-muted-foreground">
			<Loader2 class="animate-spin h-5 w-5" /> Cargando ajustes...
		</div>
	{:else if settings}
		<form onsubmit={(e) => { e.preventDefault(); save(); }} class="grid gap-6 md:grid-cols-2">

			<Card>
				<CardHeader>
					<CardTitle>Filtros y Estado</CardTitle>
					<CardDescription>Configura qué mensajes lee el TTS.</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-4">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<label for="tts-enabled" class="text-sm font-medium">TTS Activado</label>
							<p class="text-xs text-muted-foreground">Enciende o apaga el sistema completo.</p>
						</div>
						<Switch id="tts-enabled" bind:checked={settings.enabled} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<label for="skip-cmd" class="text-sm font-medium">Ignorar Comandos</label>
							<p class="text-xs text-muted-foreground">Omite los mensajes que empiezan con !</p>
						</div>
						<Switch id="skip-cmd" bind:checked={settings.skip_commands} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<label for="skip-link" class="text-sm font-medium">Ignorar Links</label>
							<p class="text-xs text-muted-foreground">Elimina las URLs del mensaje a leer.</p>
						</div>
						<Switch id="skip-link" bind:checked={settings.skip_links} />
					</div>
					<div class="grid grid-cols-2 gap-4 mt-2">
						<div class="space-y-2">
							<label class="text-sm font-medium">Longitud Max (chars)</label>
							<Input type="number" bind:value={settings.max_message_length} min="10" max="500" />
						</div>
						<div class="space-y-2">
							<label class="text-sm font-medium">Cooldown (s)</label>
							<Input type="number" bind:value={settings.cooldown_seconds} min="0" max="3600" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Acceso y Recompensas</CardTitle>
					<CardDescription>Controla quién puede usar el TTS.</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-4">
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<label for="sub-only" class="text-sm font-medium">Solo Suscriptores</label>
							<p class="text-xs text-muted-foreground">Solo los subs pueden usar el comando !tts</p>
						</div>
						<Switch id="sub-only" bind:checked={settings.sub_only} />
					</div>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<label for="mod-bypass" class="text-sm font-medium">Bypass de Mods</label>
							<p class="text-xs text-muted-foreground">Los mods y broadcaster siempre tienen acceso.</p>
						</div>
						<Switch id="mod-bypass" bind:checked={settings.mod_bypass} />
					</div>
					<div class="space-y-2 mt-2">
						<label class="text-sm font-medium">Channel Points (Nombre de recompensa)</label>
						<Input bind:value={settings.redemption_title} placeholder="TTS (vacío = desactivado)" />
						<p class="text-xs text-muted-foreground">Debe coincidir exactamente con el nombre en Twitch.</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Proveedores y Voces</CardTitle>
					<CardDescription>Configura los motores de síntesis.</CardDescription>
				</CardHeader>
				<CardContent class="grid gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium">Voz por defecto</label>
						<Input bind:value={settings.default_voice} placeholder="edge_tts:es-ES-AlvaroNeural" />
						<p class="text-xs text-muted-foreground">Formato: <code>provider:id</code>. Ej: <code>edge_tts:es-ES-AlvaroNeural</code></p>
					</div>
					<div class="space-y-2">
						<span class="text-sm font-medium">Estado de proveedores</span>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(settings.providers) as [name, available]}
								<Badge variant={available ? 'default' : 'destructive'} class="uppercase font-mono">
									{name}: {available ? 'OK' : 'OFF'}
								</Badge>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Palabras Bloqueadas</CardTitle>
					<CardDescription>El TTS no leerá estas palabras.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex flex-wrap gap-2">
						{#each settings.blocked_words as w}
							<Badge variant="secondary" class="text-sm pl-2 pr-1 py-1 flex items-center gap-1">
								{w}
								<button 
									type="button" 
									onclick={() => removeWord(w)} 
									class="ml-1 hover:text-destructive transition-colors rounded-full p-0.5 focus:outline-none"
								>
									&times;
								</button>
							</Badge>
						{/each}
					</div>
					<div class="flex items-center gap-2">
						<Input
							bind:value={newWord}
							placeholder="Añadir palabra..."
							onkeydown={(e) => e.key === 'Enter' && (e.preventDefault(), addWord())}
						/>
						<Button type="button" variant="secondary" onclick={addWord}>Añadir</Button>
					</div>
				</CardContent>
				<CardFooter class="flex justify-between border-t p-6 mt-auto">
					<div class="text-sm">
						{#if error}
							<span class="text-destructive font-medium">{error}</span>
						{:else if success}
							<span class="text-green-500 font-medium">¡Guardado exitosamente!</span>
						{/if}
					</div>
					<Button type="submit" disabled={saving}>
						{#if saving} <Loader2 class="mr-2 h-4 w-4 animate-spin" /> {/if}
						Guardar Ajustes
					</Button>
				</CardFooter>
			</Card>

		</form>
	{/if}
</div>
