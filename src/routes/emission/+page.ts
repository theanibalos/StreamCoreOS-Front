import { error } from '@sveltejs/kit';
import { EMISSION_ENABLED } from '$lib/core/runtime.config';

export function load() {
  if (!EMISSION_ENABLED) error(404, 'Página no disponible');
  return {};
}
