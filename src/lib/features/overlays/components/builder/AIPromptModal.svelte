<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Bot,
		Copy,
		Check,
		Sparkles,
		MessageSquare,
		Zap,
		BarChart3,
		Wand2,
		Layers
	} from '@lucide/svelte';

	let {
		open = $bindable(false)
	}: {
		open: boolean;
	} = $props();

	let selectedPreset = $state<'universal' | 'youtube_chat' | 'alerts' | 'stats'>('universal');
	let userRequirement = $state('');
	let copied = $state(false);

	const PRESETS = {
		universal: {
			title: '🌟 Prompt Maestro Universal',
			badge: 'Recomendado',
			desc: 'Crea cualquier componente personalizado para StreamCoreOS con soporte completo de eventos, chat y stats.',
			defaultIdea: 'Un widget moderno y animado para mi stream con diseño glassmorphism y efectos neón.'
		},
		youtube_chat: {
			title: '🔴 Chat Exclusivo de YouTube / Twitch',
			badge: 'Chat',
			desc: 'Especializado en chat en tiempo real con avatares de YouTube, badges de miembro y emotes de Twitch.',
			defaultIdea: 'Un feed de chat exclusivo para YouTube Live con avatares circulares, badges de patrocinador y animación de entrada suave.'
		},
		alerts: {
			title: '⚡ Alertas & Super Chats',
			badge: 'Alertas',
			desc: 'Especializado en capturar Super Chats de YouTube, suscripciones de Twitch, bits y donaciones con efectos.',
			defaultIdea: 'Un pop-up de alerta animado para Super Chats de YouTube y Bits de Twitch con confeti y sonido.'
		},
		stats: {
			title: '📊 HUD de Estadísticas & Barra de Metas',
			badge: 'Stats',
			desc: 'Especializado en contadores en vivo de seguidores, viewers, subs y barra de progreso de metas.',
			defaultIdea: 'Una barra de meta de seguidores y espectadores en vivo con barra de progreso brillante y contador dinámico.'
		}
	};

	const generatedPrompt = $derived.by(() => {
		const preset = PRESETS[selectedPreset];
		const idea = userRequirement.trim() || preset.defaultIdea;

		return `Actúa como un Desarrollador Senior Frontend y Diseñador Especialista en Overlays interactivos para OBS Studio y StreamCoreOS.
Tu tarea es programar un Widget de Código Personalizado (Custom Code Widget) interactivo, moderno y de alto impacto visual para OBS Studio según los requerimientos especificados abajo.

### 📐 ARQUITECTURA DE DATOS EN STREAMCOREOS
El widget se renderiza dentro de un <iframe> aislado y transparente en OBS. El sistema le inyecta datos en tiempo real mediante el evento 'streamupdate' en window:

\`\`\`javascript
// Inicialización y escucha en tiempo real
function handleStreamUpdate(data) {
  const stats = data.stats || {};
  const activeAlerts = data.activeAlerts || [];
  const chatMessages = data.chatMessages || {};

  // 1. STATS (Contadores en tiempo real):
  // stats['followers.total'] -> Total seguidores
  // stats['stream.viewer_count'] -> Viewers actuales
  // stats['subscribers.active_total'] -> Subs activos
  // stats['stream.online'] -> true / false
  // stats['followers.latest_name'] -> Último seguidor
  // stats['subscribers.latest_name'] -> Último sub
  // stats['donations.latest_name'] -> Último donante
  // stats['donations.latest_amount'] -> Último monto

  // 2. ACTIVE ALERTS (Array de eventos activos en vivo):
  // Cada alerta: { elementId, type, vars: { user_name, display_amount, message, bits, tier, viewers }, expiresAt }
  // Tipos: 'youtube.superchat', 'youtube.supersticker', 'youtube.member', 'channel.follow', 'channel.subscribe', 'channel.cheer', 'channel.raid'

  // 3. CHAT MESSAGES (Diccionario de mensajes en tiempo real):
  // Mensaje canónico:
  // {
  //   platform: 'twitch' | 'youtube',
  //   display_name: 'NombreUsuario',
  //   message: 'Texto del mensaje',
  //   color: '#9146FF',
  //   user: { id: '...', display_name: '...', avatar_url: 'https://...' }, // Avatar real del streamer o usuario
  //   badges: [ { set: 'broadcaster'|'moderator'|'subscriber'|'member'|'vip', version: '1', url: 'https://...' } ],
  //   roles: { broadcaster: true/false, moderator: true/false, subscriber: true/false, vip: true/false },
  //   fragments: [ { type: 'text'|'emote', text: '...', emote_id: '88', emote_animated: false } ]
  // }
}

// 4. CÓMO RENDERIZAR BADGES (Insignias de Twitch y YouTube):
function renderBadges(badges) {
  if (!badges || !badges.length) return '';
  return badges.map(b => {
    if (b.url) return \`<img src="\${b.url}" class="badge-icon" alt="\${b.set}" title="\${b.set}" width="18" height="18" />\`;
    if (b.set === 'broadcaster' || b.set === 'owner') return '<span class="badge-tag badge-owner" title="Creador">👑</span>';
    if (b.set === 'moderator' || b.set === 'mod') return '<span class="badge-tag badge-mod" title="Moderador">⚔</span>';
    if (b.set === 'subscriber' || b.set === 'member') return '<span class="badge-tag badge-sub" title="Suscriptor/Miembro">★</span>';
    if (b.set === 'vip') return '<span class="badge-tag badge-vip" title="VIP">💎</span>';
    return '';
  }).join('');
}

// 5. CÓMO RENDERIZAR EMOTES Y TEXTO (Fragments):
function renderFragments(fragments, fallbackText) {
  if (!fragments || !fragments.length) return fallbackText || '';
  return fragments.map(f => {
    if (f.type === 'emote' && f.emote_id) {
      const mode = f.emote_animated ? 'animated' : 'static';
      return \`<img src="https://static-cdn.jtvnw.net/emoticons/v2/\${f.emote_id}/\${mode}/dark/1.0" class="chat-emote" alt="\${f.text}" />\`;
    }
    return f.text;
  }).join('');
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.StreamCore && window.StreamCore.stats) {
    handleStreamUpdate(window.StreamCore);
  }
});

window.addEventListener('streamupdate', (event) => {
  handleStreamUpdate(event.detail);
});
\`\`\`

### 🛡️ REGLAS OBLIGATORIAS:
1. CSS: Fondo 100% transparente (\`background: transparent !important\`), diseño oscuro/glassmorphism/neón ideal para streaming, animaciones CSS fluidas (\`@keyframes\`).
2. HTML: No uses etiquetas <html>, <head> ni <body>; solo entrega los elementos contenedores internos (ej: \`<div class="widget-root">...</div>\`).
3. JavaScript:
   - Seguro contra XSS: usa \`.textContent\` o escapa textos al inyectar contenido del chat.
   - Avatares: usa siempre \`msg.user?.avatar_url\` con clase circular y \`object-fit: cover\`.
   - Badges: usa la función de badges indicada arriba soportando tanto URLs de imagen como iconos de fallback (👑 Creador, ⚔ Mod, ★ Sub/Miembro, 💎 VIP).
   - Emotes: renderiza emotes usando el endpoint de Twitch CDN indicado arriba.

### 📦 FORMATO DE ENTREGA:
Debes responder ÚNICAMENTE dividiendo el código en 3 bloques separados bien identificados:
\`\`\`html
<!-- Código HTML aquí -->
\`\`\`
\`\`\`css
/* Código CSS aquí */
\`\`\`
\`\`\`javascript
// Código JavaScript aquí
\`\`\`

---
🎯 REQUERIMIENTO ESPECÍFICO DEL COMPONENTE:
${idea}`;
	});

	function copyPrompt() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(generatedPrompt);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2500);
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-5xl max-w-5xl w-[94vw] h-[88vh] flex flex-col p-0 overflow-hidden bg-background border-border">
		<!-- Header -->
		<Dialog.Header class="px-6 py-4 border-b bg-card/70 shrink-0">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold shadow-inner">
						<Bot class="w-6 h-6" />
					</div>
					<div>
						<Dialog.Title class="text-base font-semibold flex items-center gap-2">
							Prompt Maestro para IA
							<Badge variant="outline" class="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
								ChatGPT / Claude / Gemini / DeepSeek
							</Badge>
						</Dialog.Title>
						<Dialog.Description class="text-xs text-muted-foreground mt-0.5">
							Copia este prompt optimizado y pégalo en cualquier IA para que genere componentes 100% compatibles con StreamCoreOS.
						</Dialog.Description>
					</div>
				</div>
			</div>
		</Dialog.Header>

		<!-- Content Body (Split view on desktop) -->
		<div class="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-background">
			<!-- Left Column: Presets & Requirement Config (5 cols) -->
			<div class="md:col-span-5 p-5 border-r overflow-y-auto space-y-4 custom-scrollbar bg-card/20">
				<!-- Presets Selection -->
				<div>
					<p class="text-xs font-semibold text-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
						<Sparkles class="w-3.5 h-3.5 text-primary" />
						1. Tipo de Componente
					</p>
					<div class="space-y-2">
						{#each Object.entries(PRESETS) as [key, preset] (key)}
							<button
								type="button"
								class="w-full p-3 rounded-xl border text-left transition-all relative {selectedPreset === key ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'bg-card/40 hover:bg-card/90 border-border/80'}"
								onclick={() => (selectedPreset = key as any)}
							>
								<div class="flex items-center justify-between mb-1">
									<span class="text-xs font-semibold text-foreground">{preset.title}</span>
									<Badge variant="secondary" class="text-[9px] py-0 px-1.5">
										{preset.badge}
									</Badge>
								</div>
								<p class="text-[11px] text-muted-foreground leading-relaxed">
									{preset.desc}
								</p>
							</button>
						{/each}
					</div>
				</div>

				<!-- User Custom Idea Input -->
				<div class="space-y-1.5 pt-2 border-t">
					<label for="user-prompt-idea" class="text-xs font-semibold text-foreground flex items-center justify-between">
						<span class="flex items-center gap-1.5">
							<Wand2 class="w-3.5 h-3.5 text-primary" />
							2. Personalizar Requerimiento
						</span>
					</label>
					<Textarea
						id="user-prompt-idea"
						class="min-h-[85px] text-xs bg-black/40 border-muted focus-visible:ring-1 focus-visible:ring-primary resize-none leading-relaxed"
						placeholder={PRESETS[selectedPreset].defaultIdea}
						bind:value={userRequirement}
					/>
					<p class="text-[10px] text-muted-foreground italic">
						Opcional: escribe qué quieres ver en el widget y la IA lo adaptará.
					</p>
				</div>
			</div>

			<!-- Right Column: Live Prompt Preview & Big Copy Action (7 cols) -->
			<div class="md:col-span-7 flex flex-col overflow-hidden bg-black/30 p-5">
				<div class="flex items-center justify-between mb-2 shrink-0">
					<div class="flex items-center gap-1.5">
						<span class="text-xs font-semibold text-foreground">Vista Previa del Prompt</span>
						<Badge variant="outline" class="text-[9px] font-mono text-muted-foreground">Markdown</Badge>
					</div>
					<Button
						variant="default"
						size="sm"
						class="h-8 px-4 text-xs gap-1.5 bg-primary hover:bg-primary/90 font-semibold shadow-md"
						onclick={copyPrompt}
					>
						{#if copied}
							<Check class="w-3.5 h-3.5 text-white" />
							<span>¡Copiado al Portapapeles!</span>
						{:else}
							<Copy class="w-3.5 h-3.5" />
							<span>Copiar Prompt Maestro</span>
						{/if}
					</Button>
				</div>

				<!-- Code Box -->
				<pre class="flex-1 bg-black/60 p-4 rounded-xl border border-muted/50 text-[11px] font-mono text-zinc-300 overflow-y-auto custom-scrollbar leading-relaxed whitespace-pre-wrap select-all shadow-inner"><code>{generatedPrompt}</code></pre>
			</div>
		</div>

		<!-- Footer -->
		<Dialog.Footer class="px-6 py-3 border-t bg-card/40 flex items-center justify-between shrink-0">
			<span class="text-[11px] text-muted-foreground">
				💡 <strong>Tip:</strong> Pega la respuesta de la IA en las pestañas <strong>HTML</strong>, <strong>CSS</strong> y <strong>JS</strong> del constructor.
			</span>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" onclick={() => (open = false)}>Cerrar</Button>
				<Button
					variant="default"
					size="sm"
					class="gap-1.5 bg-primary hover:bg-primary/90"
					onclick={copyPrompt}
				>
					{#if copied}
						<Check class="w-3.5 h-3.5" />
						<span>Copiado</span>
					{:else}
						<Copy class="w-3.5 h-3.5" />
						<span>Copiar Prompt</span>
					{/if}
				</Button>
			</div>
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
