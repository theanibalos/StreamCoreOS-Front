<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = "default",
		onCheckedChange,
		disabled = false,
		...restProps
	}: Omit<HTMLButtonAttributes, "onclick" | "type" | "role"> & {
		ref?: HTMLButtonElement | null;
		checked?: boolean;
		size?: "sm" | "default";
		onCheckedChange?: (checked: boolean) => void;
	} = $props();

	function toggle() {
		if (disabled) return;
		checked = !checked;
		onCheckedChange?.(checked);
	}
</script>

<button
	bind:this={ref}
	type="button"
	role="switch"
	aria-checked={checked}
	data-slot="switch"
	{disabled}
	onclick={toggle}
	class={cn(
		"relative inline-flex shrink-0 rounded-full shadow-inner transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
		size === "sm" ? "h-4 w-8" : "h-5 w-10",
		checked ? "bg-emerald-500" : "bg-muted-foreground/30",
		className
	)}
	{...restProps}
>
	<span
		class={cn(
			"absolute top-1 left-1 rounded-full bg-white shadow-sm transition-transform pointer-events-none",
			size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
			checked && (size === "sm" ? "translate-x-4" : "translate-x-5")
		)}
	></span>
</button>
