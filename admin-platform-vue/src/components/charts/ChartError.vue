<template>
  <div
    class="flex h-full w-full flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6"
  >
    <div class="mb-4 rounded-full bg-red-100 p-3">
      <svg
        class="h-6 w-6 text-red-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>

    <h3 class="mb-2 text-sm font-medium text-red-800">載入資料失敗</h3>

    <p v-if="errorMessage" class="mb-4 text-center text-xs text-red-600">
      {{ errorMessage }}
    </p>

    <button
      @click="onRetry"
      class="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
    >
      重試
    </button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  errorMessage?: string
}

interface Emits {
  (e: 'retry'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const onRetry = () => {
  emit('retry')
}
</script>
