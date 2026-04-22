<script lang="ts">
	import { AIProviderConfig, AIChatConfig, AIModerationConfig } from '$lib/features/ai';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
</script>

<div class="flex flex-col gap-6 w-full">
	<div>
		<h1 class="text-3xl font-bold tracking-tight">Inteligencia Artificial</h1>
		<p class="text-muted-foreground mt-1">Configura los proveedores de IA y el comportamiento del chatbot.</p>
	</div>

	<Tabs value="providers" class="w-full">
		<TabsList class="grid w-full max-w-2xl grid-cols-3 mb-6">
			<TabsTrigger value="providers">Proveedores</TabsTrigger>
			<TabsTrigger value="chat">Chatbot</TabsTrigger>
			<TabsTrigger value="moderation">Moderación IA</TabsTrigger>
		</TabsList>
		
		<TabsContent value="providers">
			<AIProviderConfig />
		</TabsContent>
		
		<TabsContent value="chat">
			<AIChatConfig />
		</TabsContent>

		<TabsContent value="moderation">
			<AIModerationConfig />
		</TabsContent>
	</Tabs>
</div>
