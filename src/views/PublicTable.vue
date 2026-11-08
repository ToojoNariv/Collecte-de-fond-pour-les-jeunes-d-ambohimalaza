<template>
  <div class="clean-page-container">
    <!-- 1. En-tête : Logo GÉANT à gauche qui prend tout le header jusqu'en haut, Contrôles & Somme compacte à droite -->
    <header class="hero-top-header">
      <!-- Colonne Gauche : Logo qui s'étend jusqu'au sommet du header -->
      <div class="logo-hero-side">
        <img 
          :src="logoSvg" 
          alt="Justice pour les jeunes" 
          class="header-logo-hero" 
          :style="{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)' }"
        />
      </div>

      <!-- Colonne Droite : Contrôles (Thème & Langue) en haut, Somme totale en dessous -->
      <div class="stats-controls-side">
        <!-- Contrôles Thème & Langue au sommet à droite -->
        <div class="topbar-controls">
          <!-- Bouton Thème Jour / Nuit (Noir en clair, gris en dark) -->
          <button 
            @click="toggleTheme" 
            class="ctrl-btn theme-btn" 
            :title="isDarkMode ? $t('theme_light') : $t('theme_dark')"
          >
            <i :class="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"></i>
          </button>

          <!-- Sélecteur de langue avec drapeaux GIF (style ShiftUp) -->
          <LangSwitcher />
        </div>

        <!-- Somme totale compacte (non agrandie, proportionnelle et nette) -->
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

    <!-- 2. Barre de recherche : sans fond, animation label flottant au focus/saisie, texte net et grand -->
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

    <!-- 3. Tableau DataTable avec scroll vertical (hauteur fixe), entièrement responsive -->
    <div class="table-wrapper">
      <DataTable 
        :value="filteredProducts" 
        tableStyle="min-width: 32rem"
        scrollable 
        scrollHeight="500px"
        responsiveLayout="scroll"
        :loading="loading"
        stripedRows
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

        <!-- Colonnes : Nom, Prénom, Contact, Somme en Ar -->
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

    <!-- 4. Section Remarques au-dessous du tableau, citées par points -->
    <section v-if="remarques && remarques.length > 0" class="remarques-section">
      <div class="remarques-header">
        <h3 class="remarques-heading">{{ $t('remarques_title') }}</h3>
      </div>
      <ul class="remarques-list">
        <li v-for="item in remarques" :key="item._id" class="remarque-point">
          <span class="bullet-dot">•</span>
          <span class="remarque-text">{{ getRemarqueText(item) }}</span>
        </li>
      </ul>
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
.clean-page-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* 1. En-tête : Logo GÉANT qui s'étend jusqu'au sommet du header */
.hero-top-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  padding: 0.25rem 0 0.5rem;
  gap: 2rem;
  min-height: 195px;
}

.logo-hero-side {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1;
}

.header-logo-hero {
  height: 195px;
  max-height: 220px;
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
  padding: 0.25rem 0;
}

.topbar-controls {
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

/* Bouton thème : NOIR en mode clair, GRIS en mode sombre */
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
  padding-top: 1rem;
}

.total-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.total-amount {
  font-size: 3.2rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1.05;
  transition: color 0.2s ease;
  white-space: nowrap;
}

/* 2. Barre de recherche */
.search-div-transparent {
  position: relative;
  width: 100%;
}

/* 3. Tableau et cellules */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border-radius: 14px;
}

.name-cell {
  font-weight: 800;
  font-size: 0.95rem;
}

.prenom-cell {
  font-weight: 500;
  font-size: 0.92rem;
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

/* 4. Section Remarques par points */
.remarques-section {
  margin-top: 0.5rem;
  padding: 1rem 0.25rem;
}

.remarques-header {
  margin-bottom: 0.75rem;
}

.remarques-heading {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.remarques-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.remarque-point {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.96rem;
  line-height: 1.6;
  word-break: break-word;
}

.bullet-dot {
  font-size: 1.25rem;
  line-height: 1.3;
  flex-shrink: 0;
}

.remarque-text {
  flex: 1;
}

/* Empty & Loading states */
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 700;
}

.empty-desc {
  font-size: 0.88rem;
  margin-top: 0.25rem;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem;
  font-weight: 600;
}

/* ======================================================== */
/* RESPONSIVE : TABLETTE (641px - 1024px)                  */
/* ======================================================== */
@media (min-width: 641px) and (max-width: 1024px) {
  .hero-top-header {
    min-height: 150px;
    gap: 1.5rem;
  }

  .header-logo-hero {
    height: 150px;
    max-height: 165px;
  }

  .total-amount {
    font-size: 2.6rem;
  }
}

/* ======================================================== */
/* RESPONSIVE : MOBILE (< 640px)                           */
/* ======================================================== */
@media (max-width: 640px) {
  .clean-page-container {
    padding: 0.75rem 0.85rem 2.5rem;
    gap: 1.15rem;
  }

  /* L'en-tête reste en ROW : Logo TOUT À GAUCHE et Somme TOUT À DROITE */
  .hero-top-header {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: space-between;
    width: 100%;
    min-height: auto;
    padding: 0.25rem 0 0.5rem;
    gap: 0.75rem;
  }

  /* Logo tout à gauche */
  .logo-hero-side {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 0 0 auto;
    max-width: 46%;
  }

  .header-logo-hero {
    height: 86px;
    max-height: 94px;
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
    gap: 0.5rem;
  }

  .ctrl-btn {
    width: 34px;
    height: 34px;
    font-size: 0.88rem;
  }

  :deep(.lang-switcher-wrapper) {
    width: 34px !important;
    height: 34px !important;
  }

  /* Boîte somme tout à droite, compacte */
  .total-compact-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    width: 100%;
    margin-top: auto;
    padding-top: 0.25rem;
  }

  .total-label {
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    margin-bottom: 0.15rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .total-amount {
    font-size: clamp(1.3rem, 5.2vw, 1.85rem);
    font-weight: 900;
    line-height: 1.1;
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

  .remarques-heading {
    font-size: 0.95rem;
  }

  .remarque-point {
    font-size: 0.88rem;
  }
}
</style>
