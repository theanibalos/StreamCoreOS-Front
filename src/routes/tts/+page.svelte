<script lang="ts">
	import TtsVoiceAssignments from '$lib/components/TtsVoiceAssignments.svelte';
	import TtsSettings from '$lib/components/TtsSettings.svelte';

	let activeTab = $state<'voices' | 'settings'>('voices');
</script>

<div class="page">
	<div class="header">
		<h1>TTS</h1>
		<div class="obs-hint">
			OBS Browser Source →
			<code>http://localhost:8000/tts/overlay</code>
		</div>
	</div>

	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'voices'}
			onclick={() => (activeTab = 'voices')}
		>
			Voces por usuario
		</button>
		<button
			class="tab"
			class:active={activeTab === 'settings'}
			onclick={() => (activeTab = 'settings')}
		>
			Ajustes
		</button>
	</div>

	<div class="content">
		{#if activeTab === 'voices'}
			<TtsVoiceAssignments />
		{:else}
			<TtsSettings />
		{/if}
	</div>
</div>

<style>
	.page { display: flex; flex-direction: column; gap: 0; }

	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1.25rem;
	}

	h1 {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text, #cdd6f4);
		margin: 0;
	}

	.obs-hint {
		font-size: 0.78rem;
		color: var(--subtext, #a6adc8);
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
	}

	code {
		background: var(--surface2, #1e1e2e);
		border: 1px solid var(--border, #333);
		border-radius: 4px;
		padding: 2px 6px;
		font-size: 0.78rem;
		color: var(--accent, #cba6f7);
		font-family: monospace;
	}

	.tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--border, #333);
		margin-bottom: 1.5rem;
	}

	.tab {
		padding: 0.5rem 1.25rem;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--subtext, #a6adc8);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		margin-bottom: -1px;
		transition: color 0.15s, border-color 0.15s;
	}
	.tab:hover   { color: var(--text, #cdd6f4); }
	.tab.active  {
		color: var(--accent, #cba6f7);
		border-bottom-color: var(--accent, #cba6f7);
	}

	.content { min-height: 200px; }
</style>
