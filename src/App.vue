<template>
  <div class="app-root">
    <!-- Barre supérieure ultra-épurée (Thème & Langue uniquement, aucun lien public vers la saisie) -->
    <header class="minimal-topbar">
      <div class="topbar-container">
        <!-- Bouton retour présent UNIQUEMENT si on est sur la page de saisie secrète -->
        <router-link 
          v-if="$route.path !== '/'" 
          to="/" 
          class="ctrl-btn back-btn" 
          :title="$t('back_to_table')"
        >
          <i class="pi pi-arrow-left"></i>
          <span>{{ $t('back_to_table') }}</span>
        </router-link>
        <div v-else></div>

        <!-- Contrôles discrets à droite -->
        <div class="topbar-actions">
          <!-- Bouton Thème Jour / Nuit (Noir en mode light, gris en mode dark) -->
          <button 
            @click="toggleTheme" 
            class="ctrl-btn theme-btn" 
            :title="isDark ? $t('theme_light') : $t('theme_dark')"
          >
            <i :class="isDark ? 'pi pi-sun' : 'pi pi-moon'"></i>
          </button>

          <!-- Sélecteur de langue avec drapeaux GIF (style ShiftUp) -->
          <LangSwitcher />
        </div>
      </div>
    </header>

    <!-- Notifications Toast -->
    <Toast position="top-right" />

    <!-- Contenu principal -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import LangSwitcher from './components/LangSwitcher.vue';

const isDark = ref(false);

const applyTheme = (dark) => {
  isDark.value = dark;
  if (dark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    localStorage.setItem('collecte_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('collecte_theme', 'light');
  }
};

const toggleTheme = () => {
  applyTheme(!isDark.value);
};

onMounted(() => {
  const savedTheme = localStorage.getItem('collecte_theme');
  if (savedTheme) {
    applyTheme(savedTheme === 'dark');
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  }
});
</script>

<style scoped>
.app-root {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  transition: background-color 0.25s ease, color 0.25s ease;
}

.minimal-topbar {
  width: 100%;
  padding: 1.25rem 2rem 0.25rem;
  background: transparent;
  position: relative;
  z-index: 9999;
}

.topbar-container {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.ctrl-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Bouton thème : en mode light, il est NOIR avec icône blanche */
.theme-btn {
  background: #000000 !important;
  color: #ffffff !important;
}

.theme-btn:hover {
  background: #222222 !important;
  color: #ffffff !important;
}

.back-btn {
  width: auto;
  padding: 0.45rem 0.9rem;
  border-radius: 20px;
  gap: 0.45rem;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  background: #f0f0f0;
  color: #222222;
}

.back-btn:hover {
  background: #e4e4e4;
  color: #000000;
}

/* En mode dark */
:global(html.dark) .theme-btn,
:global(body.dark) .theme-btn {
  background: #242424 !important;
  color: #f3f3f3 !important;
}

:global(html.dark) .theme-btn:hover,
:global(body.dark) .theme-btn:hover {
  background: #303030 !important;
  color: #ffffff !important;
}

:global(html.dark) .back-btn,
:global(body.dark) .back-btn {
  background: #242424;
  color: #f3f3f3;
}

:global(html.dark) .back-btn:hover,
:global(body.dark) .back-btn:hover {
  background: #303030;
  color: #ffffff;
}

.main-content {
  flex: 1;
}

@media (max-width: 640px) {
  .minimal-topbar {
    padding: 0.75rem 1rem 0.25rem;
  }
}
</style>
