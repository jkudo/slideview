<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  filename: string
}>()

const repoInfo = computed(() => {
  const url = new URL(window.location.href)
  const pathParts = url.pathname.split('/')
  const username = pathParts[1]
  const repo = pathParts[2]
  return { username, repo }
})

const pptUrl = computed(() => {
  const baseUrl = `https://raw.githubusercontent.com/${repoInfo.value.username}/${repoInfo.value.repo}/main/files/${props.filename}`
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(baseUrl)}`
})
</script>

<template>
  <div class="w-full h-[80vh] mb-8">
    <h2 class="text-2xl font-bold mb-4">{{ filename }}</h2>
    <iframe
      :src="pptUrl"
      width="100%"
      height="100%"
      frameborder="0">
    </iframe>
  </div>
</template>