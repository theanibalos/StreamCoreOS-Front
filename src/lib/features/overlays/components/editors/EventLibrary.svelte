<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import AIPromptModal from '../builder/AIPromptModal.svelte';
	import {
		MessageSquare,
		Zap,
		BarChart3,
		Code2,
		Copy,
		Check,
		Sparkles,
		Flame,
		ShieldCheck,
		Search,
		ChevronRight,
		Layers,
		Bot,
		Wand2
	} from '@lucide/svelte';

	let {
		onInsertSnippet
	}: {
		onInsertSnippet?: (snippet: { html?: string; css?: string; js?: string }) => void;
	} = $props();

	let selectedCategory = $state<'all' | 'chat' | 'alerts' | 'stats' | 'lifecycle'>('chat');
	let searchQuery = $state('');
	let copiedKey = $state<string | null>(null);
	let aiPromptOpen = $state(false);

	function copyToClipboard(text: string, key: string) {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
			copiedKey = key;
			setTimeout(() => {
				if (copiedKey === key) copiedKey = null;
			}, 2000);
		}
	}

	// ── Snippets Catalogue ───────────────────────────────────────────
	const SNIPPETS = {
		youtube_only_chat: {
			title: 'Solo Chat de YouTube',
			category: 'chat',
			platform: 'youtube',
			desc: 'Filtra y muestra exclusivamente los mensajes que provienen de YouTube Live, con soporte de avatares de canal y badges de miembro.',
			js: `// 1. Renderizar exclusivamente mensajes de YouTube
function renderYouTubeChat(chatData) {
  const container = document.getElementById('chat-container');
  if (!container) return;

  // Unificar mensajes de todos los canales de chat activos
  const allMessages = Object.values(chatData).flat();
  // FILTRO: Solo YouTube
  const ytMessages = allMessages.filter(m => m.platform === 'youtube');

  container.innerHTML = '';
  ytMessages.slice(-10).forEach(msg => {
    const el = document.createElement('div');
    el.className = 'yt-message';
    
    // Avatar de YouTube si existe
    const avatar = msg.user?.avatar_url 
      ? \`<img src="\${msg.user.avatar_url}" class="yt-avatar" alt="avatar" />\`
      : '';
    
    // Indicador si es patrocinador/miembro
    const isMember = msg.roles?.subscriber ? '<span class="yt-badge">MIEMBRO</span>' : '';

    el.innerHTML = \`
      \${avatar}
      <div class="yt-content">
        <span class="yt-name">\${msg.display_name}</span>
        \${isMember}
        <span class="yt-text">\${msg.message}</span>
      </div>
    \`;
    container.appendChild(el);
  });
}

// Escuchar actualizaciones
window.addEventListener('streamupdate', (event) => {
  renderYouTubeChat(event.detail.chatMessages || {});
});`,
			html: `<div id="chat-container" class="chat-wrapper">
  <!-- Los mensajes de YouTube se inyectarán aquí -->
</div>`,
			css: `.chat-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(15, 15, 15, 0.85);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.yt-message {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 6px 10px;
  border-radius: 8px;
  animation: fadeIn 0.25s ease-out;
}

.yt-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.yt-name {
  font-weight: 700;
  color: #ff4e45;
  font-size: 13px;
  margin-right: 4px;
}

.yt-badge {
  background: #00e676;
  color: #000;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 4px;
  margin-right: 6px;
}

.yt-text {
  color: #ffffff;
  font-size: 13px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}`
		},

		twitch_only_chat: {
			title: 'Solo Chat de Twitch (con Emotes CDN)',
			category: 'chat',
			platform: 'twitch',
			desc: 'Filtra solo mensajes de Twitch traduciendo fragments oficiales a emotes animados de alta calidad.',
			js: `function renderTwitchChat(chatData) {
  const container = document.getElementById('twitch-chat');
  if (!container) return;

  const allMessages = Object.values(chatData).flat();
  // FILTRO: Solo Twitch
  const twitchMsgs = allMessages.filter(m => m.platform === 'twitch');

  container.innerHTML = '';
  twitchMsgs.slice(-10).forEach(msg => {
    const el = document.createElement('div');
    el.className = 'tw-message';

    const userSpan = document.createElement('span');
    userSpan.className = 'tw-author';
    userSpan.style.color = msg.color || '#a970ff';
    userSpan.innerText = msg.display_name + ': ';
    el.appendChild(userSpan);

    const bodySpan = document.createElement('span');
    bodySpan.className = 'tw-body';

    // Parsear fragmentos (texto y emotes)
    (msg.fragments || [{ type: 'text', text: msg.message }]).forEach(frag => {
      if (frag.type === 'emote' && frag.emote_id) {
        const img = document.createElement('img');
        const fmt = frag.emote_animated ? 'animated' : 'static';
        img.src = \`https://static-cdn.jtvnw.net/emoticons/v2/\${frag.emote_id}/\${fmt}/dark/1.0\`;
        img.className = 'tw-emote';
        img.alt = frag.text;
        bodySpan.appendChild(img);
      } else {
        bodySpan.appendChild(document.createTextNode(frag.text));
      }
    });

    el.appendChild(bodySpan);
    container.appendChild(el);
  });
}

window.addEventListener('streamupdate', (e) => {
  renderTwitchChat(e.detail.chatMessages || {});
});`,
			html: `<div id="twitch-chat" class="tw-chat-box"></div>`,
			css: `.tw-chat-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(24, 24, 27, 0.85);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #9146ff55;
}

.tw-message {
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.tw-author {
  font-weight: 700;
}

.tw-emote {
  height: 22px;
  vertical-align: middle;
  margin: 0 2px;
}`
		},

		omnichat: {
			title: 'Chat Unificado (Twitch + YouTube con Tag)',
			category: 'chat',
			platform: 'all',
			desc: 'Recibe ambos chats y muestra una pequeña insignia indicando el origen de cada espectador.',
			js: `function renderOmniChat(chatData) {
  const box = document.getElementById('omnichat-box');
  if (!box) return;

  const all = Object.values(chatData).flat();
  box.innerHTML = '';

  all.slice(-12).forEach(msg => {
    const div = document.createElement('div');
    const isYT = msg.platform === 'youtube';
    div.className = \`msg-row \${isYT ? 'from-yt' : 'from-tw'}\`;

    const tag = document.createElement('span');
    tag.className = 'platform-tag';
    tag.innerText = isYT ? 'YT' : 'TW';

    const user = document.createElement('span');
    user.className = 'user-label';
    user.innerText = msg.display_name + ': ';
    user.style.color = msg.color || (isYT ? '#ff4e45' : '#a970ff');

    const text = document.createElement('span');
    text.className = 'msg-text';
    text.innerText = msg.message;

    div.append(tag, user, text);
    box.appendChild(div);
  });
}

window.addEventListener('streamupdate', (e) => {
  renderOmniChat(e.detail.chatMessages || {});
});`,
			html: `<div id="omnichat-box" class="omni-chat"></div>`,
			css: `.omni-chat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(10, 10, 15, 0.9);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.msg-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.platform-tag {
  font-size: 9px;
  font-weight: 800;
  padding: 2px 5px;
  border-radius: 4px;
}

.from-yt .platform-tag { background: #ff0000; color: #fff; }
.from-tw .platform-tag { background: #9146ff; color: #fff; }

.user-label { font-weight: 700; }
.msg-text { color: #eee; }`
		},

		youtube_superchat: {
			title: 'YouTube: Super Chat & Super Stickers',
			category: 'alerts',
			platform: 'youtube',
			desc: 'Detecta donaciones de Super Chat de YouTube y las muestra con tarjeta animada brillante.',
			js: `function checkSuperChats(alerts) {
  const box = document.getElementById('superchat-banner');
  if (!box) return;

  // Buscar evento de superchat o supersticker
  const sc = alerts.find(a => 
    a.type === 'youtube.superchat' || 
    a.type === 'youtube.supersticker' || 
    a.vars?.type === 'superchat'
  );

  if (sc) {
    document.getElementById('sc-donor').innerText = sc.vars.user_name || 'Donante';
    document.getElementById('sc-amount').innerText = sc.vars.display_amount || sc.vars.amount || '$5.00';
    document.getElementById('sc-msg').innerText = sc.vars.message || '¡Gracias por el apoyo!';
    box.classList.add('active');
  } else {
    box.classList.remove('active');
  }
}

window.addEventListener('streamupdate', (e) => {
  checkSuperChats(e.detail.activeAlerts || []);
});`,
			html: `<div id="superchat-banner" class="superchat-card">
  <div class="sc-header">
    <span class="sc-tag">SUPER CHAT</span>
    <span id="sc-amount" class="sc-amount">$10.00</span>
  </div>
  <div class="sc-body">
    <span id="sc-donor" class="sc-name">AlexYT</span>
    <p id="sc-msg" class="sc-comment">¡Saludos desde YouTube!</p>
  </div>
</div>`,
			css: `.superchat-card {
  display: none;
  background: linear-gradient(135deg, #e62117, #ff6b6b);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 30px rgba(230, 33, 23, 0.5);
  color: white;
}

.superchat-card.active {
  display: block;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.sc-header {
  display: flex;
  justify-content: space-between;
  font-weight: 800;
  margin-bottom: 8px;
}

.sc-tag {
  background: rgba(0,0,0,0.3);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  letter-spacing: 1px;
}

.sc-amount { font-size: 18px; color: #ffeb3b; }
.sc-name { font-size: 15px; font-weight: 700; }
.sc-comment { margin: 6px 0 0; font-size: 13px; }

@keyframes popIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}`
		},

		twitch_alerts_universal: {
			title: 'Alertas Universales (Follows, Subs, Bits)',
			category: 'alerts',
			platform: 'all',
			desc: 'Reacciona a eventos de Twitch (follows, subs, bits, raids) y YouTube con banner y animación.',
			js: `function handleAlerts(alerts) {
  const alertEl = document.getElementById('universal-alert');
  if (!alertEl) return;

  if (alerts.length > 0) {
    const cur = alerts[0];
    const type = cur.type || 'Alerta';
    const name = cur.vars?.user_name || cur.vars?.display_name || 'Alguien';
    
    let label = '¡Nuevo Evento!';
    if (type.includes('follow')) label = '¡NUEVO SEGUIDOR!';
    else if (type.includes('subscribe')) label = '¡NUEVA SUSCRIPCIÓN!';
    else if (type.includes('cheer')) label = \`¡DONACIÓN DE \${cur.vars?.bits || ''} BITS!\`;
    else if (type.includes('raid')) label = \`¡RAID CON \${cur.vars?.viewers || ''} ESPECTADORES!\`;
    else if (type.includes('superchat')) label = \`¡SUPER CHAT DE \${cur.vars?.display_amount || ''}!\`;

    document.getElementById('alert-title').innerText = label;
    document.getElementById('alert-user').innerText = name;
    alertEl.classList.add('visible');
  } else {
    alertEl.classList.remove('visible');
  }
}

window.addEventListener('streamupdate', (e) => {
  handleAlerts(e.detail.activeAlerts || []);
});`,
			html: `<div id="universal-alert" class="alert-box">
  <div class="alert-tag" id="alert-title">¡NUEVO SEGUIDOR!</div>
  <div class="alert-user" id="alert-user">StreamFan123</div>
</div>`,
			css: `.alert-box {
  opacity: 0;
  transform: translateY(-20px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(10, 10, 20, 0.9);
  border: 2px solid #a855f7;
  box-shadow: 0 0 25px rgba(168, 85, 247, 0.4);
  padding: 16px 24px;
  border-radius: 16px;
  text-align: center;
}

.alert-box.visible {
  opacity: 1;
  transform: translateY(0);
}

.alert-tag {
  color: #c084fc;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.alert-user {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
}`
		},

		channel_stats_hud: {
			title: 'HUD de Estadísticas y Pool Dinámico',
			category: 'stats',
			platform: 'all',
			desc: 'Muestra seguidores totales, espectadores, último suscriptor y lee cualquier variable personalizada enviada por backend.',
			js: `function updateHUD(stats) {
  // 1. Estadísticas estándar
  const followers = stats['followers.total'] || '0';
  const viewers = stats['stream.viewer_count'] || '0';
  const latestSub = stats['subscribers.latest_name'] || '---';

  // 2. Variables dinámicas personalizadas (ej. pool de backend)
  const meta = stats['meta.donaciones_hoy'] || '0';

  document.getElementById('val-followers').innerText = followers;
  document.getElementById('val-viewers').innerText = viewers;
  document.getElementById('val-latest-sub').innerText = latestSub;
}

window.addEventListener('DOMContentLoaded', () => {
  if (window.StreamCore?.stats) updateHUD(window.StreamCore.stats);
});

window.addEventListener('streamupdate', (e) => {
  updateHUD(e.detail.stats || {});
});`,
			html: `<div class="hud-bar">
  <div class="hud-item">
    <span class="hud-lbl">SEGUIDORES</span>
    <span id="val-followers" class="hud-val">0</span>
  </div>
  <div class="hud-item">
    <span class="hud-lbl">VIEWERS</span>
    <span id="val-viewers" class="hud-val">0</span>
  </div>
  <div class="hud-item">
    <span class="hud-lbl">ÚLTIMO SUB</span>
    <span id="val-latest-sub" class="hud-val">---</span>
  </div>
</div>`,
			css: `.hud-bar {
  display: flex;
  gap: 16px;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 10px 18px;
  border-radius: 9999px;
  backdrop-filter: blur(10px);
}

.hud-item {
  display: flex;
  flex-direction: column;
}

.hud-lbl {
  font-size: 9px;
  font-weight: 800;
  color: #94a3b8;
  letter-spacing: 1px;
}

.hud-val {
  font-size: 14px;
  font-weight: 700;
  color: #38bdf8;
}`
		}
	};

	const filteredSnippets = $derived(
		Object.entries(SNIPPETS).filter(([key, s]) => {
			if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return (
				s.title.toLowerCase().includes(q) ||
				s.desc.toLowerCase().includes(q) ||
				s.platform.toLowerCase().includes(q)
			);
		})
	);
</script>

<div class="space-y-4">
	<!-- AI Master Prompt Banner -->
	<div class="p-3 rounded-xl bg-gradient-to-r from-primary/20 via-purple-500/15 to-pink-500/10 border border-primary/30 flex items-center justify-between gap-3 shadow-sm">
		<div class="flex items-center gap-2.5">
			<div class="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
				<Bot class="w-4 h-4" />
			</div>
			<div>
				<div class="flex items-center gap-1.5">
					<span class="text-xs font-semibold text-foreground">¿Crear con IA? (ChatGPT, Claude, etc.)</span>
					<Badge variant="outline" class="text-[9px] py-0 px-1 bg-primary/10 text-primary border-primary/30 font-semibold">
						Prompt Maestro
					</Badge>
				</div>
				<p class="text-[10px] text-muted-foreground">
					Copia el prompt técnico exacto para que cualquier IA te programe este overlay sin errores.
				</p>
			</div>
		</div>

		<Button
			variant="default"
			size="sm"
			class="h-7 text-[11px] gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shrink-0 shadow"
			onclick={() => (aiPromptOpen = true)}
		>
			<Wand2 class="w-3 h-3" />
			<span>Copiar Prompt IA</span>
		</Button>
	</div>

	<!-- Search & Category Header -->
	<div class="space-y-2">
		<div class="relative">
			<Search class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
			<input
				type="text"
				placeholder="Buscar eventos, chat youtube, stats..."
				bind:value={searchQuery}
				class="w-full bg-background border rounded-lg pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>

		<!-- Category Chips -->
		<div class="flex flex-wrap gap-1.5">
			<button
				type="button"
				class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 {selectedCategory === 'chat' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}"
				onclick={() => (selectedCategory = 'chat')}
			>
				<MessageSquare class="w-3 h-3" />
				Chat Multiplataforma
			</button>
			<button
				type="button"
				class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 {selectedCategory === 'alerts' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}"
				onclick={() => (selectedCategory = 'alerts')}
			>
				<Zap class="w-3 h-3" />
				Alertas & Eventos
			</button>
			<button
				type="button"
				class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 {selectedCategory === 'stats' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}"
				onclick={() => (selectedCategory = 'stats')}
			>
				<BarChart3 class="w-3 h-3" />
				Stats & Pool
			</button>
		</div>
	</div>

	<!-- Event Architecture Cheat Sheet (Interactive Accordion) -->
	<div class="p-3 bg-muted/40 rounded-lg border text-xs space-y-2">
		<div class="flex items-center justify-between font-semibold text-foreground text-[11px]">
			<span class="flex items-center gap-1.5">
				<Sparkles class="w-3.5 h-3.5 text-amber-400" />
				Estructura Inyectada en Vivo: <code>window.StreamCore</code>
			</span>
			<Badge variant="outline" class="text-[9px] font-mono">Evento 'streamupdate'</Badge>
		</div>
		<p class="text-[10px] text-muted-foreground leading-relaxed">
			Tu código recibe en tiempo real el objeto multiplexado con las 3 fuentes:
		</p>
		<pre class="bg-black/40 p-2 rounded text-[10px] font-mono text-emerald-400 overflow-x-auto"><code>{"{"}
  "stats": {"{"} "followers.total": "8400", "stream.viewer_count": "1200" {"}"},
  "activeAlerts": [{"{"} "type": "youtube.superchat", "vars": {"{"} "user_name": "...", "amount": "..." {"}"} {"}"}],
  "chatMessages": {"{"} "widget_id": [{"{"} "platform": "youtube", "display_name": "...", "message": "..." {"}"}] {"}"}
{"}"}</code></pre>
	</div>

	<!-- Snippets List -->
	<div class="space-y-3">
		{#each filteredSnippets as [key, snippet] (key)}
			<div class="p-3 rounded-xl border bg-card/60 hover:border-primary/40 transition-all space-y-2.5 shadow-sm">
				<div class="flex items-start justify-between gap-2">
					<div class="space-y-0.5">
						<div class="flex items-center gap-1.5">
							<span class="text-xs font-semibold text-foreground">{snippet.title}</span>
							{#if snippet.platform === 'youtube'}
								<Badge variant="destructive" class="text-[9px] py-0 px-1 font-bold bg-red-600/20 text-red-500 border-red-500/30">
									YouTube
								</Badge>
							{:else if snippet.platform === 'twitch'}
								<Badge variant="outline" class="text-[9px] py-0 px-1 font-bold bg-purple-600/20 text-purple-400 border-purple-500/30">
									Twitch
								</Badge>
							{:else}
								<Badge variant="outline" class="text-[9px] py-0 px-1 font-bold bg-sky-600/20 text-sky-400 border-sky-500/30">
									Multiplataforma
								</Badge>
							{/if}
						</div>
						<p class="text-[11px] text-muted-foreground leading-relaxed">
							{snippet.desc}
						</p>
					</div>
				</div>

				<!-- Code Preview Accordion / Action Buttons -->
				<div class="flex items-center gap-1.5 pt-1">
					<Button
						variant="outline"
						size="sm"
						class="h-7 text-[11px] flex-1 gap-1"
						onclick={() => copyToClipboard(snippet.js, `${key}_js`)}
					>
						{#if copiedKey === `${key}_js`}
							<Check class="w-3 h-3 text-emerald-500" />
							<span>Copiado!</span>
						{:else}
							<Copy class="w-3 h-3" />
							<span>Copiar JS</span>
						{/if}
					</Button>

					{#if onInsertSnippet}
						<Button
							variant="default"
							size="sm"
							class="h-7 text-[11px] gap-1 bg-primary hover:bg-primary/90"
							onclick={() => onInsertSnippet({ html: snippet.html, css: snippet.css, js: snippet.js })}
						>
							<Sparkles class="w-3 h-3" />
							<span>Aplicar Plantilla</span>
						</Button>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<AIPromptModal bind:open={aiPromptOpen} />
