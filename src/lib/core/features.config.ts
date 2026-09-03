import type { Component } from 'svelte';
import {
	LayoutDashboard,
	Users,
	Star,
	Terminal,
	Shield,
	Timer,
	Volume2,
	Monitor,
	Activity,
	Sparkles,
	KeyRound,
	Webhook,
	RadioTower
} from '@lucide/svelte';

export const FEATURES: { id: string; href: string; label: string; icon: Component }[] = [
	{ id: 'dashboard', href: '/', label: 'Panel', icon: LayoutDashboard },
	{ id: 'viewers', href: '/viewers', label: 'Espectadores', icon: Users },
	{ id: 'subscribers', href: '/subscribers', label: 'Subs', icon: Star },
	{ id: 'commands', href: '/commands', label: 'Comandos', icon: Terminal },
	{ id: 'moderation', href: '/moderation', label: 'Moderación', icon: Shield },
	{ id: 'timers', href: '/timers', label: 'Temporizadores', icon: Timer },
	{ id: 'tts', href: '/tts', label: 'TTS', icon: Volume2 },
	{ id: 'webhooks', href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
	{ id: 'emission', href: '/emission', label: 'Emisión', icon: RadioTower },
	{ id: 'overlays', href: '/overlays', label: 'Overlays', icon: Monitor },
	{ id: 'system', href: '/system', label: 'Sistema', icon: Activity },
	{ id: 'ai', href: '/ai', label: 'AI', icon: Sparkles },
	{ id: 'settings', href: '/settings', label: 'Ajustes', icon: KeyRound }
];
