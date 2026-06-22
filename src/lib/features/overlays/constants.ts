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
	{ value: 'channel.follow',            label: 'Seguimiento (Follow)' },
	{ value: 'channel.subscribe',         label: 'Suscripción / Resub' },
	{ value: 'channel.subscription.gift', label: 'Sub Regalada' },
	{ value: 'channel.cheer',             label: 'Bits (Cheer)' },
	{ value: 'channel.raid',              label: 'Raid' },
	{ value: 'chat.message',              label: 'Mensaje de Chat' }
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
	'chat.message':              [{ name: 'display_name', label: 'Nombre' }, { name: 'message', label: 'Mensaje' }]
};
