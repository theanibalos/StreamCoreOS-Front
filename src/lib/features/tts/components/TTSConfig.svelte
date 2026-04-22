<script lang="ts">
	import { onMount } from 'svelte';
	import { ttsSettings, fetchTtsSettings, updateTtsSettings } from '../stores/settings.svelte';
	import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Slider } from '$lib/components/ui/slider';
	import { Badge } from '$lib/components/ui/badge';
	import { 
		Save, Volume2, Shield, Star, Link, Slash, 
		Clock, Type, Zap, Ghost, AlertTriangle, RefreshCw
	} from '@lucide/svelte';

	onMount(async () => {
		await fetchTtsSettings();
	});

	async function handleSave() {
		await updateTtsSettings(ttsSettings.data);
	}

	// Palabras bloqueadas
	let newWord = $state('');
	function addWord() {
		const w = newWord.trim().toLowerCase();
		if (w && !ttsSettings.data.blocked_words.includes(w)) {
			ttsSettings.data.blocked_words = [...ttsSettings.data.blocked_words, w];
		}
		newWord = '';
	}
	function removeWord(w: string) {
		ttsSettings.data.blocked_words = ttsSettings.data.blocked_words.filter(x => x !== w);
	}
</script>

<div class="flex flex-col gap-6 w-full">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div class="space-y-1">
			<h2 class="text-2xl font-bold tracking-tight">Configuración Maestra de TTS</h2>
			<p class="text-muted-foreground text-sm">Ajusta cómo el motor de voz interactúa con tu comunidad.</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="outline" size="sm" onclick={() => fetchTtsSettings()} disabled={ttsSettings.loading}>
				<RefreshCw class="w-3.5 h-3.5 mr-2 {ttsSettings.loading ? 'animate-spin' : ''}" />
				Recargar
			</Button>
			<Button size="sm" onclick={handleSave} disabled={ttsSettings.loading}>
				<Save class="w-3.5 h-3.5 mr-2" />
				{ttsSettings.loading ? 'Guardando...' : 'Guardar Todo'}
			</Button>
		</div>
	</div>

	{#if ttsSettings.error}
		<div class="bg-destructive/15 text-destructive p-4 rounded-xl border border-destructive/50 text-sm flex items-center gap-3">
			<AlertTriangle class="w-5 h-5 flex-shrink-0" />
			{ttsSettings.error}
		</div>
	{/if}

	<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
		<!-- Interruptor Maestro -->
		<Card class="border-primary/20 shadow-lg lg:col-span-3 bg-primary/5">
			<CardContent class="p-6">
				<div class="flex items-center justify-between gap-6">
					<div class="flex items-center gap-4">
						<div class="p-3 bg-primary/20 rounded-full">
							<Volume2 class="w-8 h-8 text-primary" />
						</div>
						<div>
							<h3 class="text-lg font-bold">Servidor de Voz</h3>
							<p class="text-sm text-muted-foreground">Si está desactivado, ningún mensaje será procesado por el bot.</p>
						</div>
					</div>
					<div class="flex items-center gap-4">
						<Badge variant={ttsSettings.data.enabled ? 'default' : 'secondary'} class="h-8 px-4 text-xs font-black tracking-widest">
							{ttsSettings.data.enabled ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'}
						</Badge>
						<Switch bind:checked={ttsSettings.data.enabled} class="scale-125" />
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- Filtros de Inteligencia -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Zap class="w-5 h-5 text-yellow-500" />
					<CardTitle>Filtros de IA</CardTitle>
				</div>
				<CardDescription>Optimización de lectura automática.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
					<div class="space-y-0.5">
						<Label class="text-sm font-bold flex items-center gap-2">
							<Slash class="w-3.5 h-3.5 text-muted-foreground" /> Ignorar Comandos
						</Label>
						<p class="text-[10px] text-muted-foreground">No lee mensajes que empiecen por "!"</p>
					</div>
					<Switch bind:checked={ttsSettings.data.skip_commands} />
				</div>
				<div class="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
					<div class="space-y-0.5">
						<Label class="text-sm font-bold flex items-center gap-2">
							<Link class="w-3.5 h-3.5 text-muted-foreground" /> Limpiar Enlaces
						</Label>
						<p class="text-[10px] text-muted-foreground">Elimina automáticamente URLs del texto.</p>
					</div>
					<Switch bind:checked={ttsSettings.data.skip_links} />
				</div>
			</CardContent>
		</Card>

		<!-- Seguridad y Privacidad -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Shield class="w-5 h-5 text-blue-500" />
					<CardTitle>Control de Acceso</CardTitle>
				</div>
				<CardDescription>Quién y cuándo puede hablar.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
					<div class="space-y-0.5">
						<Label class="text-sm font-bold flex items-center gap-2">
							<Star class="w-3.5 h-3.5 text-yellow-600" /> Modo Sub
						</Label>
						<p class="text-[10px] text-muted-foreground">Restringe el comando !tts a suscriptores.</p>
					</div>
					<Switch bind:checked={ttsSettings.data.sub_only} />
				</div>
				<div class="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
					<div class="space-y-0.5">
						<Label class="text-sm font-bold flex items-center gap-2">
							<Ghost class="w-3.5 h-3.5 text-primary" /> Mod Bypass
						</Label>
						<p class="text-[10px] text-muted-foreground">Moderadores ignoran todas las restricciones.</p>
					</div>
					<Switch bind:checked={ttsSettings.data.mod_bypass} />
				</div>
			</CardContent>
		</Card>

		<!-- Límites de Generación -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Clock class="w-5 h-5 text-green-500" />
					<CardTitle>Rendimiento</CardTitle>
				</div>
				<CardDescription>Límites físicos de la síntesis.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="space-y-3">
					<div class="flex justify-between">
						<Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Longitud Máxima</Label>
						<Badge variant="outline" class="font-mono">{ttsSettings.data.max_message_length}c</Badge>
					</div>
					<Slider 
						value={[ttsSettings.data.max_message_length]} 
						min={10} max={500} step={10} 
						onValueChange={(v) => ttsSettings.data.max_message_length = v[0]}
					/>
				</div>
				<div class="space-y-3">
					<div class="flex justify-between">
						<Label class="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cooldown Anti-Spam</Label>
						<Badge variant="outline" class="font-mono">{ttsSettings.data.cooldown_seconds}s</Badge>
					</div>
					<Slider 
						value={[ttsSettings.data.cooldown_seconds]} 
						min={0} max={60} step={1} 
						onValueChange={(v) => ttsSettings.data.cooldown_seconds = v[0]}
					/>
				</div>
			</CardContent>
		</Card>

		<!-- Recompensas de Canal -->
		<Card class="md:col-span-2">
			<CardHeader>
				<div class="flex items-center gap-2">
					<Zap class="w-5 h-5 text-purple-500" />
					<CardTitle>Integración con Channel Points</CardTitle>
				</div>
				<CardDescription>Vincula una recompensa de Twitch para activar el TTS.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid gap-2">
					<Label for="red-title" class="text-xs font-bold uppercase text-muted-foreground">Nombre de la Recompensa (Twitch)</Label>
					<Input 
						id="red-title"
						bind:value={ttsSettings.data.redemption_title} 
						placeholder="Ej: Mensaje de Voz" 
						class="bg-muted/30 border-primary/20"
					/>
					<p class="text-[10px] text-muted-foreground italic">
						* El nombre debe ser EXACTAMENTE igual al que tienes en el Dashboard de Twitch.
					</p>
				</div>
			</CardContent>
		</Card>

		<!-- Blacklist -->
		<Card class="md:col-span-2">
			<CardHeader>
				<CardTitle>Diccionario de Palabras Prohibidas</CardTitle>
				<CardDescription>Cualquier mensaje que contenga estas palabras será ignorado.</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="flex flex-wrap gap-2 min-h-[40px] p-4 bg-muted/20 rounded-xl border border-dashed">
					{#each ttsSettings.data.blocked_words as w}
						<Badge variant="secondary" class="pl-2 pr-1 py-1 rounded-full group">
							{w}
							<button onclick={() => removeWord(w)} class="ml-1 opacity-50 group-hover:opacity-100 text-destructive">
								<Slash class="w-3 h-3 rotate-45" />
							</button>
						</Badge>
					{/each}
					{#if ttsSettings.data.blocked_words.length === 0}
						<span class="text-xs text-muted-foreground italic">No hay palabras bloqueadas.</span>
					{/if}
				</div>
				<div class="flex gap-2">
					<Input bind:value={newWord} placeholder="Añadir palabra..." onkeydown={e => e.key === 'Enter' && addWord()} />
					<Button variant="secondary" onclick={addWord}>Añadir</Button>
				</div>
			</CardContent>
		</Card>
	</div>
</div>
