<script setup lang="ts">
import { onBeforeUnmount } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { MotionConfig } from 'motion-v'

import AppHeader from '@/components/shell/AppHeader.vue'
import AppMark from '@/components/shell/AppMark.vue'
import AppSidebar from '@/components/shell/AppSidebar.vue'
import { useViewTransition } from '@/composables/shared/useViewTransition'

const MAIN_CONTENT_ID = 'main-content'

const stopViewTransition = useViewTransition(useRouter())
onBeforeUnmount(stopViewTransition)
</script>

<template>
  <!-- reducedMotion="user": motion-v rispetta prefers-reduced-motion (di default lo ignora) -->
  <MotionConfig reduced-motion="user">
    <a
      :href="`#${MAIN_CONTENT_ID}`"
      class="skip-link bg-federal px-4 py-2 font-semibold text-on-federal"
    >
      Vai al contenuto
    </a>
    <div class="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      <AppSidebar />
      <div class="flex min-w-0 flex-col">
        <AppHeader>
          <template #brand>
            <span class="md:hidden"><AppMark compact /></span>
            <span class="hidden md:block"><AppMark /></span>
          </template>
        </AppHeader>
        <main
          :id="MAIN_CONTENT_ID"
          tabindex="-1"
          class="app-main flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-10"
        >
          <RouterView />
        </main>
      </div>
    </div>
  </MotionConfig>
</template>

<style scoped>
.app-main {
  view-transition-name: main-content;
}

.app-main:focus {
  outline: none;
}
</style>
