<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import PptViewer from './PptViewer.vue'

const slides = ref<string[]>([])
const lastUpdated = ref<string>('')

async function loadSlides() {
  try {
    const response = await fetch('files/slides.json')
    const data = await response.json()
    slides.value = data.slides || []
    lastUpdated.value = data.lastUpdated || ''
  } catch (error) {
    console.error('Failed to load slides list:', error)
    slides.value = []
  }
}

// Initial load
onMounted(loadSlides)

// Poll for updates every 30 seconds
const POLL_INTERVAL = 30000
let pollInterval: number

onMounted(() => {
  pollInterval = setInterval(loadSlides, POLL_INTERVAL)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<template>
  <div class="slides-container">
    <div v-if="slides.length === 0" class="text-center py-8">
      <p class="text-gray-500">PowerPointファイルを files ディレクトリにアップロードしてください。</p>
    </div>
    <div v-else>
      <div v-for="slide in slides" :key="slide" class="slide-item">
        <PptViewer :filename="slide" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.slides-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.slide-item {
  margin-bottom: 2rem;
}
</style>