import type { Component } from 'svelte';
import {
	LayoutDashboard,
	MessageSquare,
	Users,
	Star,
	Terminal,
	Shield,
	Timer,
	Volume2,
	Monitor,
	Activity,
	Sparkles,
	KeyRound
} from '@lucide/svelte';

export const FEATURES: { id: string; href: string; label: string; icon: Component }[] = [
	{ id: 'dashboard', href: '/', label: 'Panel', icon: LayoutDashboard },
	{ id: 'chat', href: '/chat', label: 'Chat', icon: MessageSquare },
	{ id: 'viewers', href: '/viewers', label: 'Espectadores', icon: Users },
	{ id: 'subscribers', href: '/subscribers', label: 'Subs', icon: Star },
	{ id: 'commands', href: '/commands', label: 'Comandos', icon: Terminal },
	{ id: 'moderation', href: '/moderation', label: 'Moderación', icon: Shield },
	{ id: 'timers', href: '/timers', label: 'Temporizadores', icon: Timer },
	{ id: 'tts', href: '/tts', label: 'TTS', icon: Volume2 },
	{ id: 'overlays', href: '/overlays', label: 'Overlays', icon: Monitor },
	{ id: 'system', href: '/system', label: 'Sistema', icon: Activity },
	{ id: 'ai', href: '/ai', label: 'AI', icon: Sparkles },
	{ id: 'settings', href: '/settings', label: 'Ajustes', icon: KeyRound }
];
