<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		value = $bindable([]),
		class: className,
		...restProps
	}: SliderPrimitive.RootProps = $props();
</script>

<SliderPrimitive.Root
	bind:ref
	bind:value
	class={cn("relative flex w-full touch-none select-none items-center", className)}
	{...restProps}
>
	<span class="bg-secondary relative h-1.5 w-full grow overflow-hidden rounded-full">
		<SliderPrimitive.Range class="bg-primary absolute h-full" />
	</span>
	{#each value as _, i}
		<SliderPrimitive.Thumb
			index={i}
			class="border-primary bg-background ring-offset-background focus-visible:ring-ring block h-4 w-4 rounded-full border shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
		/>
	{/each}
</SliderPrimitive.Root>
