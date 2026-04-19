<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// ── State ──────────────────────────────────────────────────────────────────
	let currentSpeaker = $state<string | null>(null);
	let queue: { username: string; text: string; audio_b64: string }[] = [];
	let playing = false;
	let es: EventSource | null = null;
	let audioCtx: AudioContext | null = null;

	// ── SSE connection ─────────────────────────────────────────────────────────
	function connect() {
		es = new EventSource('/tts/overlay/stream');

		es.onmessage = (e) => {
			try {
				const msg = JSON.parse(e.data);
				if (msg.type === 'audio') {
					enqueue(msg);
				}
			} catch {
				// ignore malformed
			}
		};

		es.onerror = () => {
			es?.close();
			// Reconnect after 3 s
			setTimeout(connect, 3000);
		};
	}

	// ── Sequential audio queue ─────────────────────────────────────────────────
	function enqueue(msg: { username: string; text: string; audio_b64: string }) {
		queue.push(msg);
		if (!playing) playNext();
	}

	async function playNext() {
		if (queue.length === 0) {
			playing = false;
			currentSpeaker = null;
			return;
		}
		playing = true;
		const item = queue.shift()!;
		currentSpeaker = item.username;

		try {
			await playAudio(item.audio_b64);
		} catch (err) {
			console.error('[TTS overlay] playback error:', err);
		}

		// Small gap between messages
		await sleep(300);
		playNext();
	}

	async function playAudio(b64: string): Promise<void> {
		if (!audioCtx) {
			audioCtx = new AudioContext();
		}
		// Resume context if suspended (browser autoplay policy)
		if (audioCtx.state === 'suspended') {
			await audioCtx.resume();
		}

		const binary = atob(b64);
		const bytes  = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

		const buffer = await audioCtx.decodeAudioData(bytes.buffer);
		return new Promise((resolve) => {
			const source = audioCtx!.createBufferSource();
			source.buffer = buffer;
			source.connect(audioCtx!.destination);
			source.onended = () => resolve();
			source.start(0);
		});
	}

	function sleep(ms: number) {
		return new Promise((r) => setTimeout(r, ms));
	}

	// ── Lifecycle ──────────────────────────────────────────────────────────────
	onMount(() => {
		connect();
	});

	onDestroy(() => {
		es?.close();
		audioCtx?.close();
	});
</script>

<!--
	OBS Browser Source overlay.
	Background is transparent — only the speaker label renders.
	Size recommended in OBS: 400 x 60 px.
-->
{#if currentSpeaker}
	<div class="speaker-badge">
		<span class="icon">🔊</span>
		<span class="name">{currentSpeaker}</span>
	</div>
{/if}

<style>
	:global(body) {
		background: transparent;
	}

	.speaker-badge {
		position: fixed;
		bottom: 16px;
		left: 16px;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 999px;
		padding: 6px 16px 6px 10px;
		animation: fadeIn 0.2s ease;
	}

	.icon {
		font-size: 1rem;
		line-height: 1;
	}

	.name {
		font-family: 'Inter', 'Segoe UI', sans-serif;
		font-size: 0.95rem;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: 0.01em;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to   { opacity: 1; transform: translateY(0); }
	}
</style>
