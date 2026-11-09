<template>
  <span class="digit-slot" :style="slotCustomStyle">
    <span 
      class="digit-ribbon" 
      :style="ribbonStyle"
    >
      <span 
        v-for="d in 10" 
        :key="d - 1" 
        class="digit-cell"
        :style="cellCustomStyle"
      >
        {{ d - 1 }}
      </span>
    </span>
  </span>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  value: {
    type: Number,
    required: true,
    default: 0
  },
  animDuration: {
    type: Number,
    default: 800
  },
  animDelay: {
    type: Number,
    default: 0
  },
  slotWidth: {
    type: String,
    default: '0.62em'
  },
  slotHeight: {
    type: String,
    default: '1.15em'
  }
});

const currentDigit = ref(props.value);
const hasTransition = ref(false);

const slotCustomStyle = computed(() => ({
  width: props.slotWidth,
  height: props.slotHeight,
  lineHeight: props.slotHeight
}));

const cellCustomStyle = computed(() => ({
  height: props.slotHeight,
  lineHeight: props.slotHeight
}));

const ribbonStyle = computed(() => {
  const d = Math.max(0, Math.min(9, Math.round(currentDigit.value)));
  return {
    transform: `translateY(-${d * 10}%)`,
    transition: hasTransition.value 
      ? `transform ${props.animDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${props.animDelay}ms` 
      : 'none'
  };
});

watch(() => props.value, (newVal) => {
  const d = Math.max(0, Math.min(9, Math.round(newVal)));
  if (d !== currentDigit.value) {
    hasTransition.value = true;
    currentDigit.value = d;
  }
});

onMounted(() => {
  // Attendre deux frames d'animation pour que le rendu initial se peigne sans animation parasite
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hasTransition.value = true;
    });
  });
});
</script>

<style scoped>
.digit-slot {
  display: inline-block;
  overflow: hidden;
  position: relative;
  vertical-align: -0.12em;
  user-select: none;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.digit-ribbon {
  display: flex;
  flex-direction: column;
  width: 100%;
  will-change: transform;
}

.digit-cell {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
  color: inherit;
  flex-shrink: 0;
}
</style>
