<script setup lang="ts">
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const categories: { name: string; emojis: string[] }[] = [
  { name: 'Sucré', emojis: ['🍬', '🍭', '🍫', '🍪', '🍰', '🧁', '🍩', '🍦', '🍨', '🍿', '🍇', '🍓', '🍎', '🍌'] },
  { name: 'Repas', emojis: ['🍕', '🍔', '🍟', '🌭', '🥨', '🥪', '🌮', '🥗', '🍝', '🍱', '🍣', '🥞', '🧇', '🥐'] },
  { name: 'Jeux', emojis: ['🎮', '🕹️', '🎲', '🧩', '♟️', '🃏', '🎯', '🎰', '🪀', '🛹', '⚽', '🏀', '🏓', '🥊'] },
  { name: 'Écran', emojis: ['📺', '🎬', '🎞️', '🎭', '🎪', '📱', '💻', '🎧', '🎤', '🎵', '🎸', '🥁'] },
  { name: 'Sortie', emojis: ['🎢', '🎡', '🎠', '🏊', '🚴', '🛴', '🏕️', '🌳', '🦌', '🏖️', '⛰️', '🚗', '🚂', '✈️'] },
  { name: 'Cadeau', emojis: ['🎁', '🧸', '🎈', '🎉', '🎀', '🌟', '⭐', '✨', '💎', '👑', '🛒', '📚', '✏️', '🎨'] },
  { name: 'Câlin', emojis: ['⏰', '🛌', '😴', '🤗', '❤️', '💕', '🥰', '😊', '🌈', '☀️', '🌙', '⭐', '🌸', '🍀'] }
]

function pick(emoji: string) {
  emit('update:modelValue', emoji)
}
</script>

<template>
  <div class="emoji-picker">
    <div v-for="cat in categories" :key="cat.name" class="cat">
      <div class="cat-name">{{ cat.name }}</div>
      <div class="emojis">
        <button
          v-for="e in cat.emojis"
          :key="e"
          type="button"
          class="emoji-btn"
          :class="{ selected: modelValue === e }"
          @click="pick(e)"
        >{{ e }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  border: 1px solid hsl(var(--b3));
  border-radius: 0.5rem;
  padding: 0.5rem;
  background: hsl(var(--b1));
  max-height: 240px;
  overflow-y: auto;
}
.cat + .cat { margin-top: 0.5rem; }
.cat-name {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}
.emojis {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}
.emoji-btn {
  font-size: 1.5rem;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.375rem;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.emoji-btn:hover {
  background: hsl(var(--b2));
}
.emoji-btn.selected {
  background: hsl(var(--p) / 0.2);
  border-color: hsl(var(--p));
}
</style>
