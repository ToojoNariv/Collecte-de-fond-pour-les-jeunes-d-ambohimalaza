<template>
  <div class="lang-switcher-wrapper" ref="wrapperRef" @click.stop="toggleMenu">
    <!-- Affichage du drapeau gif actif -->
    <div class="lang-icon-display" :title="currentLangObj?.name">
      <img :src="currentLangObj?.gif" class="lang-gif-main" :alt="currentLangObj?.name" />
    </div>

    <!-- Dropdown avec les 3 drapeaux gif (style ShiftUp) -->
    <div class="lang-dropdown" v-if="isLangMenuOpen">
      <div 
        v-for="lang in availableLanguages" 
        :key="lang.code" 
        class="lang-option"
        :style="{ backgroundImage: `url(${lang.gif})` }"
        :class="{ 'active': locale === lang.code }"
        @click.stop="selectLocale(lang.code)"
      >
        <span class="lang-name">{{ lang.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const isLangMenuOpen = ref(false);
const wrapperRef = ref(null);

const availableLanguages = [
  { code: 'fr', name: 'Français', gif: 'https://res.cloudinary.com/dzgdjei0h/image/upload/v1772994723/france-flag-gif_lqygo7.gif' },
  { code: 'en', name: 'English', gif: 'https://res.cloudinary.com/dzgdjei0h/image/upload/v1772798239/United_Kingdom_United_Kingdom_Flag_GIF_United_Kingdom_United_Kingdom_Flag_Flag_Waving_discover_and_share_GIFs_1_ennasn.gif' },
  { code: 'mg', name: 'Malagasy', gif: 'https://res.cloudinary.com/dzgdjei0h/image/upload/v1772798282/Madagascar_Flag_Gif_GIF_-_Madagascar_Flag_Gif_Africa_-_Discover_Share_GIFs_1_xfbaa4.gif' }
];

const currentLangObj = computed(() => {
  return availableLanguages.find(l => l.code === locale.value) || availableLanguages[0];
});

const toggleMenu = () => {
  isLangMenuOpen.value = !isLangMenuOpen.value;
};

const selectLocale = (code) => {
  locale.value = code;
  localStorage.setItem('collecte_lang', code);
  isLangMenuOpen.value = false;
};

// Fermer au clic extérieur
const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) {
    isLangMenuOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.lang-switcher-wrapper {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease;
  user-select: none;
  z-index: 999999;
}

.lang-switcher-wrapper:hover {
  transform: scale(1.08);
}

.lang-icon-display {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: none;
  border: none;
}

.lang-gif-main {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}

/* Dropdown style ShiftUp neutre au z-index maximal */
.lang-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: rgba(26, 26, 26, 0.98);
  backdrop-filter: blur(14px);
  border-radius: 16px;
  padding: 6px;
  width: 150px;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.5);
  border: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: dropdown-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1000000;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.lang-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 12px;
  color: #ffffff;
  transition: all 0.25s ease;
  cursor: pointer;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.lang-option::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  transition: background 0.25s ease;
}

.lang-option:hover::before {
  background: rgba(255, 255, 255, 0.2);
}

.lang-option.active::before {
  background: rgba(255, 255, 255, 0.35);
}

.lang-option.active {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}

.lang-name {
  position: relative;
  z-index: 1;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
</style>

