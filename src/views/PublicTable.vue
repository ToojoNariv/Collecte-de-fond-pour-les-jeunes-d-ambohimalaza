<template>
  <div class="clean-page-container">
    <!-- 1. En-tête : Logo GÉANT à gauche, Contrôles en haut à droite, et Somme totale augmentée à droite -->
    <header class="hero-top-header">
      <!-- Colonne Gauche : Logo tout à gauche -->
      <div class="logo-hero-side">
        <img 
          :src="logoSvg" 
          alt="Justice pour les jeunes" 
          class="header-logo-hero" 
          :style="{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)' }"
        />
      </div>

      <!-- Colonne Droite : Contrôles (Thème & Langue) en haut, Somme totale augmentée en dessous -->
      <div class="stats-controls-side">
        <!-- Contrôles Thème & Langue au sommet à droite -->
        <div class="topbar-controls">
          <button 
            @click="toggleTheme" 
            class="ctrl-btn theme-btn" 
            :title="isDarkMode ? $t('theme_light') : $t('theme_dark')"
          >
            <i :class="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
          </button>
          <LangSwitcher />
        </div>

        <!-- Somme totale : Taille augmentée et mise en valeur -->
        <div class="total-compact-box">
          <span class="total-label">{{ $t('total_collected') }}</span>
          <h1 
            class="total-amount" 
            :style="{ color: isDarkMode ? '#ffffff' : '#111111' }"
          >
            {{ formatSomme(totalSomme) }}
          </h1>
        </div>
      </div>
    </header>

    <!-- 2. Barre de recherche : sans fond, animation label flottant au focus/saisie -->
    <div class="search-div-transparent">
      <FloatLabel 
        variant="in" 
        :class="{ 'p-floatlabel-active': isSearchFocused || !!value2 }"
      >
        <InputText 
          id="in_label" 
          v-model="value2" 
          class="w-full search-input-bold" 
          autocomplete="off" 
          @focus="isSearchFocused = true"
          @blur="isSearchFocused = false"
        />
        <label for="in_label">
          {{ $t('search_placeholder') }}
        </label>
      </FloatLabel>
      <button 
        v-if="value2" 
        @click="value2 = ''" 
        class="clear-search-btn" 
        :title="$t('clear') || 'Effacer'"
      >
        <i class="pi pi-times"></i>
      </button>
    </div>

    <!-- 3. Tableau DataTable : s'adapte à l'espace restant (flex) avec scroll vertical interne -->
    <div class="table-wrapper">
      <DataTable 
        :value="filteredProducts" 
        tableStyle="min-width: 30rem"
        scrollable 
        scrollHeight="flex"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
        class="p-datatable-flex-scroll"
      >
        <template #empty>
          <div class="empty-state">
            <i class="pi pi-search-minus empty-icon"></i>
            <p class="empty-title">{{ $t('empty_title') }}</p>
            <p class="empty-desc" v-if="value2">
              {{ $t('empty_search') }} "<strong>{{ value2 }}</strong>".
            </p>
            <p class="empty-desc" v-else>
              {{ $t('empty_no_data') }}
            </p>
          </div>
        </template>

        <template #loading>
          <div class="loading-state">
            <i class="pi pi-spin pi-spinner text-2xl"></i>
            <span>{{ $t('loading') }}</span>
          </div>
        </template>

        <!-- Colonnes : Nom, Prénom (ou 'Prénom anonyme'), Contact, Somme en Ar -->
        <Column field="nom" :header="$t('col_nom')" sortable>
          <template #body="slotProps">
            <div class="name-cell">
              {{ slotProps.data.nom }}
            </div>
          </template>
        </Column>

        <Column field="prenom" :header="$t('col_prenom')" sortable>
          <template #body="slotProps">
            <div class="prenom-cell" :class="{ 'prenom-anonyme': !slotProps.data.prenom || !slotProps.data.prenom.trim() }">
              {{ slotProps.data.prenom && slotProps.data.prenom.trim() ? slotProps.data.prenom : ($t('anonymous_firstname') || 'Prénom anonyme') }}
            </div>
          </template>
        </Column>

        <Column field="contact" :header="$t('col_contact')" sortable>
          <template #body="slotProps">
            <div class="contact-cell">
              {{ slotProps.data.contact }}
            </div>
          </template>
        </Column>

        <Column field="somme" :header="$t('col_somme')" sortable>
          <template #body="slotProps">
            <div class="somme-cell">
              {{ formatSomme(slotProps.data.somme) }}
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- 4. Section Remarques : scrollable sans scrollbar avec dégradé d'opacité 0 en bas -->
    <section v-if="remarques && remarques.length > 0" class="remarques-section">
      <div class="remarques-header">
        <h3 class="remarques-heading">{{ $t('remarques_title') }}</h3>
      </div>
      <div class="remarques-scroll-box">
        <ul class="remarques-list">
          <li v-for="item in remarques" :key="item._id" class="remarque-point">
            <span class="bullet-dot">•</span>
            <span class="remarque-text">{{ getRemarqueText(item) }}</span>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { ProductService } from '@/service/ProductService';
import LangSwitcher from '@/components/LangSwitcher.vue';
import logoSvg from '@/assets/logo.svg';

const { locale } = useI18n();

// Variables du template
const products = ref([]);
const value2 = ref('');
const isSearchFocused = ref(false);
const loading = ref(false);
const totalSomme = ref(0);
const totalCount = ref(0);

// Remarques dynamiques
const remarques = ref([]);

// Détection réactive du mode sombre
const isDarkMode = ref(false);
let themeObserver = null;

const checkDarkMode = () => {
  isDarkMode.value = document.documentElement.classList.contains('dark') || 
                     document.body.classList.contains('dark');
};

const toggleTheme = () => {
  const isDarkNow = document.documentElement.classList.contains('dark') || 
                    document.body.classList.contains('dark');
  const newTheme = !isDarkNow;
  if (newTheme) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
    localStorage.setItem('collecte_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    localStorage.setItem('collecte_theme', 'light');
  }
  isDarkMode.value = newTheme;
};

// Formatage en Ariary (Ar)
const formatSomme = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 Ar';
  return new Intl.NumberFormat('fr-MG', {
    maximumFractionDigits: 0
  }).format(amount) + ' Ar';
};

// Texte de la remarque selon la langue sélectionnée
const getRemarqueText = (item) => {
  if (!item) return '';
  const lang = locale.value;
  if (lang === 'mg' && item.texte_mg) return item.texte_mg;
  if (lang === 'en' && item.texte_en) return item.texte_en;
  if (lang === 'fr' && item.texte_fr) return item.texte_fr;
  return item.texte_fr || item.texte_mg || item.texte_en || '';
};

// Récupération des dons et des remarques
const loadData = async (query = '') => {
  loading.value = true;
  try {
    const response = await ProductService.getDonations(query);
    products.value = response.data || [];
    totalSomme.value = response.totalSomme || 0;
    totalCount.value = response.totalCount || 0;
  } catch (err) {
    console.error('Erreur lors du chargement des contributions:', err);
  } finally {
    loading.value = false;
  }
};

const loadRemarques = async () => {
  try {
    const list = await ProductService.getRemarques();
    remarques.value = list || [];
  } catch (err) {
    console.error('Erreur chargement remarques:', err);
  }
};

// Filtrage réactif automatique instantané (%motclé%, %d%, contact, nom, prénom)
const filteredProducts = computed(() => {
  if (!products.value) return [];
  const query = (value2.value || '').trim();
  if (!query) return products.value;

  const parts = query.split('%').filter(Boolean);
  if (parts.length === 0) return products.value;

  return products.value.filter((item) => {
    const nom = (item.nom || '').toLowerCase();
    const prenom = (item.prenom || 'Prénom anonyme').toLowerCase();
    const contactRaw = (item.contact || '').toLowerCase();
    const contactCleaned = contactRaw.replace(/\s+/g, '');

    return parts.every((p) => {
      const pLower = p.toLowerCase();
      const pCleanDigits = pLower.replace(/\s+/g, '');

      if (pLower === 'd') {
        return /\d/.test(contactRaw) || nom.includes('d') || prenom.includes('d');
      }

      return (
        nom.includes(pLower) ||
        prenom.includes(pLower) ||
        contactRaw.includes(pLower) ||
        (pCleanDigits && contactCleaned.includes(pCleanDigits))
      );
    });
  });
});

// Recherche serveur automatique avec debounce
let searchTimer = null;
watch(value2, (newVal) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadData(newVal);
  }, 350);
});

onMounted(() => {
  checkDarkMode();
  loadData();
  loadRemarques();

  themeObserver = new MutationObserver(() => {
    checkDarkMode();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
});

onBeforeUnmount(() => {
  if (themeObserver) {
    themeObserver.disconnect();
  }
});
</script>

<style scoped>
/* Conteneur principal Home : s'adapte strictement à 100vh / 100dvh SANS SCROLL DE PAGE */
.clean-page-container {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  height: 100vh;
  height: 100dvh;
  max-height: 100dvh;
  padding: 0.65rem 1.25rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  overflow: hidden;
  box-sizing: border-box;
}

/* 1. En-tête : Logo à gauche, Contrôles en haut à droite, Somme augmentée à droite */
.hero-top-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  padding: 0.15rem 0 0.35rem;
  gap: 1.5rem;
  flex-shrink: 0;
}

.logo-hero-side {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
}

.header-logo-hero {
  height: 165px;
  max-height: 180px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  transition: filter 0.2s ease, height 0.2s ease;
  user-select: none;
}

.stats-controls-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  text-align: right;
  flex-shrink: 0;
  padding: 0.1rem 0;
}

.topbar-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ctrl-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Bouton thème : NOIR en clair, GRIS en dark */
.theme-btn {
  background: #000000 !important;
  color: #ffffff !important;
}

.theme-btn:hover {
  background: #222222 !important;
  color: #ffffff !important;
}

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

.total-compact-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  margin-top: auto;
  padding-top: 0.5rem;
}

.total-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.2rem;
}

/* Somme totale augmentée */
.total-amount {
  font-size: 3.5rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.02;
  transition: color 0.2s ease;
  white-space: nowrap;
}

/* 2. Barre de recherche compacte */
.search-div-transparent {
  position: relative;
  width: 100%;
  flex-shrink: 0;
}

/* 3. Tableau et cellules : prend tout l'espace restant (flex) */
.table-wrapper {
  flex: 1 1 0;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 14px;
}

.table-wrapper :deep(.p-datatable) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.table-wrapper :deep(.p-datatable-table-container) {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
}

.name-cell {
  font-weight: 800;
  font-size: 0.95rem;
}

.prenom-cell {
  font-weight: 500;
  font-size: 0.92rem;
}

.prenom-anonyme {
  font-style: italic;
  opacity: 0.75;
}

.contact-cell {
  font-weight: 500;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
}

.somme-cell {
  font-weight: 800;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
}

/* 4. Section Remarques : scrollable sans scrollbar avec dégradé d'opacité 0 en bas */
.remarques-section {
  flex-shrink: 0;
  padding: 0.2rem 0.25rem 0.4rem;
  margin-top: 0;
}

.remarques-header {
  margin-bottom: 0.35rem;
}

.remarques-heading {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.remarques-scroll-box {
  max-height: 80px;
  overflow-y: auto;
  position: relative;
  /* Scrollbar masquée */
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
  /* Dégradé d'opacité 0 pour les textes en bas afin d'indiquer que c'est scrollable */
  -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 24px), transparent 100%);
  mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 24px), transparent 100%);
}

.remarques-scroll-box::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

.remarques-list {
  list-style: none;
  padding: 0 0 1.25rem 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.remarque-point {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.45;
  word-break: break-word;
}

.bullet-dot {
  font-size: 1.15rem;
  line-height: 1.3;
  flex-shrink: 0;
}

.remarque-text {
  flex: 1;
}

/* Empty & Loading states */
.empty-state {
  text-align: center;
  padding: 2.5rem 1rem;
}

.empty-icon {
  font-size: 2.2rem;
  margin-bottom: 0.5rem;
}

.empty-title {
  font-size: 1rem;
  font-weight: 700;
}

.empty-desc {
  font-size: 0.85rem;
  margin-top: 0.2rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem;
  font-weight: 600;
}

/* ======================================================== */
/* RESPONSIVE : TABLETTE (641px - 1024px)                  */
/* ======================================================== */
@media (min-width: 641px) and (max-width: 1024px) {
  .clean-page-container {
    padding: 0.65rem 1.15rem 0.5rem;
    gap: 0.6rem;
  }

  .header-logo-hero {
    height: 135px;
    max-height: 145px;
  }

  .total-amount {
    font-size: 2.85rem;
  }

  .remarques-scroll-box {
    max-height: 72px;
  }
}

/* ======================================================== */
/* RESPONSIVE : MOBILE (< 640px)                           */
/* ======================================================== */
@media (max-width: 640px) {
  .clean-page-container {
    padding: 0.5rem 0.75rem 0.4rem;
    gap: 0.55rem;
  }

  /* L'en-tête reste en ligne : Logo TOUT À GAUCHE et Somme TOUT À DROITE */
  .hero-top-header {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: space-between;
    width: 100%;
    min-height: auto;
    padding: 0.15rem 0 0.3rem;
    gap: 0.65rem;
  }

  /* Logo encore augmenté pour la version mobile */
  .logo-hero-side {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 0 0 auto;
    max-width: 48%;
  }

  .header-logo-hero {
    height: 108px;
    max-height: 118px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  /* Contrôles et Somme tout à droite */
  .stats-controls-side {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    text-align: right;
    flex: 1;
    min-width: 0;
    padding: 0;
  }

  .topbar-controls {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  .ctrl-btn {
    width: 32px;
    height: 32px;
    font-size: 0.82rem;
  }

  :deep(.lang-switcher-wrapper) {
    width: 32px !important;
    height: 32px !important;
  }

  /* Somme totale augmentée pour mobile */
  .total-compact-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    width: 100%;
    margin-top: auto;
    padding-top: 0.2rem;
  }

  .total-label {
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    margin-bottom: 0.1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .total-amount {
    font-size: clamp(1.85rem, 6.8vw, 2.45rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  .name-cell,
  .somme-cell {
    font-size: 0.88rem;
  }

  .prenom-cell,
  .contact-cell {
    font-size: 0.84rem;
  }

  /* Remarques sur mobile : compact et scrollable sans barre avec dégradé */
  .remarques-section {
    padding: 0.15rem 0.15rem 0.25rem;
  }

  .remarques-heading {
    font-size: 0.84rem;
    margin-bottom: 0.2rem;
  }

  .remarques-scroll-box {
    max-height: 62px;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 20px), transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 20px), transparent 100%);
  }

  .remarque-point {
    font-size: 0.82rem;
    gap: 0.45rem;
    line-height: 1.4;
  }
}
</style>
