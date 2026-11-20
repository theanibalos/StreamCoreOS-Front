// La web conserva la emisión; el build de escritorio usa únicamente el bot.
export const EMISSION_ENABLED = import.meta.env.VITE_STREAMCOREOS_DESKTOP !== 'true';
