const fs = require('fs');
const path = require('path');

const mapping = {
  "$lib/api/client": "$lib/core/api/client",
  "$lib/stores/auth.svelte": "$lib/core/stores/auth.svelte",
  "$lib/stores/stream.svelte": "$lib/core/stores/stream.svelte",

  "$lib/components/AIChatConfig.svelte": "$lib/features/ai",
  "$lib/components/AIModerationConfig.svelte": "$lib/features/ai",
  "$lib/components/AIProviderConfig.svelte": "$lib/features/ai",

  "$lib/components/AlertFeed.svelte": "$lib/features/chat",
  "$lib/components/ChatReminders.svelte": "$lib/features/chat",
  "$lib/components/ChatViewer.svelte": "$lib/features/chat",
  "$lib/stores/alerts.svelte": "$lib/features/chat",
  "$lib/stores/chat.svelte": "$lib/features/chat",

  "$lib/components/CommandsManager.svelte": "$lib/features/commands",

  "$lib/components/ModLog.svelte": "$lib/features/moderation",
  "$lib/components/ModerationRules.svelte": "$lib/features/moderation",

  "$lib/components/SystemHealth.svelte": "$lib/features/system",
  "$lib/SystemGraph.svelte": "$lib/features/system",

  "$lib/components/TimersManager.svelte": "$lib/features/timers",

  "$lib/components/TtsSettings.svelte": "$lib/features/tts",
  "$lib/components/TtsVoiceAssignments.svelte": "$lib/features/tts",

  "$lib/components/RegularsManager.svelte": "$lib/features/viewers",
  "$lib/components/ViewerLookup.svelte": "$lib/features/viewers",
  "$lib/components/ViewersLeaderboard.svelte": "$lib/features/viewers",

  "$lib/components/StreamStatus.svelte": "$lib/features/dashboard",
  "$lib/components/ManualActions.svelte": "$lib/features/dashboard"
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // For components exported via index.ts, we should rewrite `import X from '$lib/components/X.svelte'` to `import { X } from '$lib/features/domain'`
  // For now, let's just do a simple regex for default imports
  for (const [oldPath, newPath] of Object.entries(mapping)) {
    const regex = new RegExp(`import\\s+([a-zA-Z0-9_]+)\\s+from\\s+['"]${oldPath.replace(/[\.\$]/g, '\\$&')}['"];?`, 'g');
    if (newPath.includes('features')) {
      content = content.replace(regex, (match, p1) => {
        changed = true;
        return `import { ${p1} } from '${newPath}';`;
      });
    }
    
    // Generic replace for those that are not default components (like stores/api)
    const genericRegex = new RegExp(`['"]${oldPath.replace(/[\.\$]/g, '\\$&')}['"]`, 'g');
    if (content.match(genericRegex) && !newPath.includes('features')) {
       content = content.replace(genericRegex, `'${newPath}'`);
       changed = true;
    }
    // stores in features
    if (oldPath.includes('stores') && newPath.includes('features')) {
        content = content.replace(genericRegex, `'${newPath}'`);
        changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.svelte') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(path.join(__dirname, 'src'));
