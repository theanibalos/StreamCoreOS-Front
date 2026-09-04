import type { ElementStyle } from './types';

// Shared option lists used by widget editor field definitions.

export const STAT_SOURCES = [
	{ value: 'subscribers.active_total', label: 'Suscriptores Activos' },
	{ value: 'followers.total',          label: 'Total de Seguidores' },
	{ value: 'stream.viewer_count',      label: 'Espectadores Actuales' },
	{ value: 'bits.total',               label: 'Total de Bits' },
	{ value: 'stream.online',            label: 'Estado Online (true/false)' }
];

export const ALERT_EVENTS = [
	{ value: 'channel.follow',            label: 'Twitch: Seguimiento (Follow)' },
	{ value: 'channel.subscribe',         label: 'Twitch: Suscripción / Resub' },
	{ value: 'channel.subscription.gift', label: 'Twitch: Sub Regalada' },
	{ value: 'channel.cheer',             label: 'Twitch: Bits (Cheer)' },
	{ value: 'channel.raid',              label: 'Twitch: Raid' },
	{ value: 'youtube.superchat',         label: 'YouTube: Super Chat' },
	{ value: 'youtube.supersticker',      label: 'YouTube: Super Sticker' },
	{ value: 'youtube.member',            label: 'YouTube: Nueva Membresía' },
	{ value: 'chat.message',              label: 'Chat: Mensaje Destacado' },
	{ value: 'stream.session.started',    label: 'Sistema: Inicio de Stream' },
	{ value: 'stream.session.ended',      label: 'Sistema: Fin de Stream' }
];

export const ANIMATIONS: { value: ElementStyle['animation']; label: string }[] = [
	{ value: 'scale_in',   label: 'Escalar' },
	{ value: 'fade_in',    label: 'Desvanecer' },
	{ value: 'slide_up',   label: 'Deslizar arriba' },
	{ value: 'slide_down', label: 'Deslizar abajo' }
];

// Template variables available per alert event (drives the editor "chips").
export const ALERT_EVENT_VARS: Record<string, { name: string; label: string }[]> = {
	'channel.follow':            [{ name: 'user_name', label: 'Usuario' }],
	'channel.subscribe':         [{ name: 'user_name', label: 'Usuario' }, { name: 'tier', label: 'Tier' }, { name: 'message', label: 'Mensaje' }],
	'channel.subscription.gift': [{ name: 'user_name', label: 'Usuario' }, { name: 'total', label: 'Total' }, { name: 'tier', label: 'Tier' }],
	'channel.cheer':             [{ name: 'user_name', label: 'Usuario' }, { name: 'bits', label: 'Bits' }],
	'channel.raid':              [{ name: 'user_name', label: 'Usuario' }, { name: 'viewers', label: 'Espectadores' }],
	'youtube.superchat':         [{ name: 'user_name', label: 'Donante' }, { name: 'display_amount', label: 'Monto' }, { name: 'message', label: 'Mensaje' }],
	'youtube.supersticker':      [{ name: 'user_name', label: 'Donante' }, { name: 'display_amount', label: 'Monto' }],
	'youtube.member':            [{ name: 'user_name', label: 'Miembro' }, { name: 'message', label: 'Detalle' }],
	'chat.message':              [{ name: 'display_name', label: 'Nombre' }, { name: 'message', label: 'Mensaje' }, { name: 'platform', label: 'Plataforma' }],
	'stream.session.started':    [{ name: 'broadcaster_login', label: 'Canal' }]
};
