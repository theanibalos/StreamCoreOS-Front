<script lang="ts">
	import { onMount } from 'svelte';
	import { get, post, put, del } from '$lib/core/api/client';
	import type {
		TimerData,
		GetTimersResponse,
		TimerResponse,
		UpdateTimerResponse,
		DeleteTimerResponse
	} from '$lib/types/api';
	import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import { RefreshCw, Pencil, Trash2, Check, X, Timer } from '@lucide/svelte';

	// ── State ────────────────────────────────────────────────────────────────
	let timers = $state<TimerData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Inline-edit
	let editingId = $state<number | null>(null);
	let editName = $state('');
	let editMessage = $state('');
	let editInterval = $state(10);
	let editMinLines = $state(0);
	let saving = $state(false);

	// New timer form
	let showForm = $state(false);
	let newName = $state('');
	let newMessage = $state('');
	let newInterval = $state(10);
	let newMinLines = $state(0);
	let creating = $state(false);
	let formError = $state<string | null>(null);

	// ── Load ─────────────────────────────────────────────────────────────────
	async function load() {
		loading = true;
		error = null;
		try {
			const res = await get<GetTimersResponse>('/timers');
			timers = res.success ? (res.data ?? []) : [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);

	// ── Toggle enabled ───────────────────────────────────────────────────────
	async function toggleEnabled(timer: TimerData) {
		const next = timer.enabled === 1 ? 0 : 1;
		try {
			const res = await put<UpdateTimerResponse>(`/timers/${timer.id}`, { enabled: next });
			if (res.success && res.data) {
				timers = timers.map((t) => (t.id === timer.id ? res.data! : t));
			} else {
				error = res.error ?? 'Failed to update timer.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// ── Create ───────────────────────────────────────────────────────────────
	async function create() {
		formError = null;
		const name = newName.trim();
		const message = newMessage.trim();
		if (!name || !message) {
			formError = 'Name and message are required.';
			return;
		}
		if (newInterval < 1) {
			formError = 'Interval must be at least 1 minute.';
			return;
		}
		creating = true;
		try {
			const res = await post<TimerResponse>('/timers', {
				name,
				message,
				interval_minutes: newInterval,
				min_lines: newMinLines
			});
			if (res.success && res.data) {
				timers = [...timers, res.data];
				newName = '';
				newMessage = '';
				newInterval = 10;
				newMinLines = 0;
				showForm = false;
			} else {
				formError = res.error ?? 'Failed to create timer.';
			}
		} catch (e) {
			formError = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}

	// ── Edit ─────────────────────────────────────────────────────────────────
	function startEdit(t: TimerData) {
		editingId = t.id;
		editName = t.name;
		editMessage = t.message;
		editInterval = t.interval_minutes;
		editMinLines = t.min_lines;
	}

	function cancelEdit() {
		editingId = null;
	}

	async function saveEdit(id: number) {
		saving = true;
		try {
			const res = await put<UpdateTimerResponse>(`/timers/${id}`, {
				name: editName.trim(),
				message: editMessage.trim(),
				interval_minutes: editInterval,
				min_lines: editMinLines
			});
			if (res.success && res.data) {
				timers = timers.map((t) => (t.id === id ? res.data! : t));
				editingId = null;
			} else {
				error = res.error ?? 'Failed to save.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			saving = false;
		}
	}

	// ── Delete ───────────────────────────────────────────────────────────────
	async function remove(id: number) {
		if (!confirm('Delete this timer?')) return;
		try {
			const res = await del<DeleteTimerResponse>(`/timers/${id}`);
			if (res.success) {
				timers = timers.filter((t) => t.id !== id);
			} else {
				error = res.error ?? 'Failed to delete.';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	function formatLast(ts: string | null): string {
		if (!ts) return '—';
		const d = new Date(ts);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="flex flex-col gap-6">
	<Card>
		<CardHeader class="flex flex-row items-center justify-between border-b pb-4">
			<div>
				<CardTitle class="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
					<Timer class="w-5 h-5 text-primary" /> Timers
				</CardTitle>
				<CardDescription>Automated messages sent to chat on a recurring interval.</CardDescription>
			</div>
			<div class="flex gap-2">
				<Button variant="outline" size="icon" onclick={load} disabled={loading}>
					<RefreshCw class="w-4 h-4 {loading ? 'animate-spin' : ''}" />
				</Button>
				<Button onclick={() => (showForm = !showForm)} variant={showForm ? 'secondary' : 'default'}>
					{showForm ? 'Cancel' : '+ New'}
				</Button>
			</div>
		</CardHeader>

		{#if error}
			<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded mx-6 mt-4">{error}</p>
		{/if}

		{#if showForm}
			<CardContent class="bg-muted/30 border-b p-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label for="new-timer-name" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</label>
						<Input id="new-timer-name" bind:value={newName} placeholder="My timer" />
					</div>
					<div class="flex flex-col gap-2">
						<label for="new-timer-message" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</label>
						<Input id="new-timer-message" bind:value={newMessage} placeholder="Chat message…" />
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-2">
						<label for="new-timer-interval" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Interval (min)</label>
						<Input id="new-timer-interval" type="number" min="1" bind:value={newInterval} />
					</div>
					<div class="flex flex-col gap-2">
						<label for="new-timer-minlines" class="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Min lines</label>
						<Input id="new-timer-minlines" type="number" min="0" bind:value={newMinLines} />
					</div>
				</div>

				{#if formError}
					<p class="text-xs text-destructive font-medium bg-destructive/10 p-2 rounded">{formError}</p>
				{/if}

				<Button onclick={create} disabled={creating} class="w-full sm:w-auto self-end">
					{creating ? 'Creating…' : 'Create'}
				</Button>
			</CardContent>
		{/if}

		<CardContent class="p-0">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head>Name</Table.Head>
						<Table.Head>Message</Table.Head>
						<Table.Head class="text-center">Interval</Table.Head>
						<Table.Head class="text-center">Min lines</Table.Head>
						<Table.Head class="text-center">Last run</Table.Head>
						<Table.Head class="text-center">Enabled</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if loading && timers.length === 0}
						<Table.Row><Table.Cell colspan={7} class="text-center py-10 text-muted-foreground italic">Loading…</Table.Cell></Table.Row>
					{:else if timers.length === 0}
						<Table.Row><Table.Cell colspan={7} class="text-center py-10 text-muted-foreground italic">No timers yet. Create one above.</Table.Cell></Table.Row>
					{:else}
						{#each timers as timer (timer.id)}
							{#if editingId === timer.id}
								<Table.Row class="bg-muted/50">
									<Table.Cell>
										<Input bind:value={editName} />
									</Table.Cell>
									<Table.Cell>
										<Input bind:value={editMessage} />
									</Table.Cell>
									<Table.Cell class="text-center">
										<Input type="number" min="1" bind:value={editInterval} class="w-20 mx-auto text-center" />
									</Table.Cell>
									<Table.Cell class="text-center">
										<Input type="number" min="0" bind:value={editMinLines} class="w-20 mx-auto text-center" />
									</Table.Cell>
									<Table.Cell class="text-center text-muted-foreground">{formatLast(timer.last_executed_at)}</Table.Cell>
									<Table.Cell class="text-center">
										<Switch checked={timer.enabled === 1} onCheckedChange={() => toggleEnabled(timer)} />
									</Table.Cell>
									<Table.Cell class="text-right">
										<div class="flex justify-end gap-1">
											<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => saveEdit(timer.id)} disabled={saving}>
												<Check class="w-3.5 h-3.5" />
											</Button>
											<Button variant="ghost" size="icon" class="h-8 w-8" onclick={cancelEdit}>
												<X class="w-3.5 h-3.5" />
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{:else}
								<Table.Row class={timer.enabled === 0 ? 'opacity-60 bg-muted/20' : ''}>
									<Table.Cell class="font-medium text-primary">{timer.name}</Table.Cell>
									<Table.Cell class="max-w-[300px] truncate text-muted-foreground">{timer.message}</Table.Cell>
									<Table.Cell class="text-center text-muted-foreground">{timer.interval_minutes}m</Table.Cell>
									<Table.Cell class="text-center text-muted-foreground">{timer.min_lines}</Table.Cell>
									<Table.Cell class="text-center text-muted-foreground">{formatLast(timer.last_executed_at)}</Table.Cell>
									<Table.Cell class="text-center">
										<Switch checked={timer.enabled === 1} onCheckedChange={() => toggleEnabled(timer)} />
									</Table.Cell>
									<Table.Cell class="text-right">
										<div class="flex justify-end gap-1">
											<Button variant="ghost" size="icon" class="h-8 w-8" onclick={() => startEdit(timer)}>
												<Pencil class="w-3.5 h-3.5" />
											</Button>
											<Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive" onclick={() => remove(timer.id)}>
												<Trash2 class="w-3.5 h-3.5" />
											</Button>
										</div>
									</Table.Cell>
								</Table.Row>
							{/if}
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</CardContent>
	</Card>
</div>
