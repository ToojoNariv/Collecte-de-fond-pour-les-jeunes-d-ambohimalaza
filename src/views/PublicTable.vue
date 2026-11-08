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

        <!-- Colonne Index incrémenté (sans titre) -->
        <Column header="" class="index-col" style="width: 3.5rem; text-align: center;">
          <template #body="slotProps">
            <span class="row-index-badge">{{ slotProps.index + 1 }}</span>
          </template>
        </Column>

        <!-- Colonnes : Nom (majuscules), Prénom (ou 'Prénom anonyme'), Contact masqué, Somme en Ar (nowrap) -->
        <Column field="nom" :header="$t('col_nom')" sortable>
          <template #body="slotProps">
            <div class="name-cell">
              {{ (slotProps.data.nom || '').toUpperCase() }}
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
              {{ formatContact(slotProps.data.contact) }}
            </div>
          </template>
        </Column>

        <Column field="somme" :header="$t('col_somme')" sortable class="somme-col" style="white-space: nowrap;">
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

// Formatage en Ariary (Ar) avec espace insécable et strict affichage en ligne
const formatSomme = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0\u00A0Ar';
  return new Intl.NumberFormat('fr-MG', {
    maximumFractionDigits: 0
  }).format(amount) + '\u00A0Ar';
};

// Formatage et masquage confidentiel des numéros de téléphone et contacts
const formatContact = (contact) => {
  if (!contact || typeof contact !== 'string') return '* ** ** *** **';
  const trimmed = contact.trim();
  if (!trimmed) return '* ** ** *** **';

  const digits = trimmed.replace(/\D/g, '');
  // S'il ne s'agit pas de chiffres / numéro valide (moins de 6 chiffres, ex: 'Tap tap send', 'Payment_ LIMITEA', etc.)
  if (digits.length < 6) {
    return '* ** ** *** **';
  }

  // 1. Détection des numéros malgaches (10 chiffres commençant par 0 ou 9 chiffres débutant par 20/32/33/34/38)
  const isMadaLocal = /^(0)?(20|32|33|34|38)\d{7}$/.test(digits) && !trimmed.startsWith('+') && !trimmed.startsWith('00');
  const isMadaInternational = /^(261)(20|32|33|34|38)\d{7}$/.test(digits);

  if (isMadaLocal) {
    let d = digits;
    if (d.length === 9) d = '0' + d;
    // Format strict demandé : 0 00 00 000 **
    return `${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 8)} **`;
  }

  if (isMadaInternational) {
    const d = digits.slice(3);
    if (trimmed.startsWith('+')) {
      return `+261 ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 7)} **`;
    }
    return `0 ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 7)} **`;
  }

  // 2. Numéros étrangers (Canada, Suisse, France, Belgique, etc.)
  // Si le numéro a déjà son format d'origine (espaces, tirets, parenthèses, points)
  const hasOriginalFormatting = /[\s\-\.\(\)]/.test(trimmed);
  if (hasOriginalFormatting) {
    let count = 0;
    const chars = trimmed.split('');
    for (let i = chars.length - 1; i >= 0; i--) {
      if (/\d/.test(chars[i])) {
        chars[i] = '*';
        count++;
        if (count === 2) break;
      }
    }
    return chars.join('');
  }

  // Si le numéro étranger a été saisi d'un seul bloc (sans espaces)
  const cleanStr = trimmed.replace(/^00/, '+');

  // Canada / USA (+1)
  if (cleanStr.startsWith('+1') || (digits.length === 11 && digits.startsWith('1'))) {
    const d = digits.startsWith('1') ? digits.slice(1) : digits;
    if (d.length === 10) {
      return `+1 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} **`;
    }
  }

  // France (+33 ou commençant par 06/07/01.. avec 10 chiffres)
  if (cleanStr.startsWith('+33') || /^0[1-9]\d{8}$/.test(digits)) {
    let d = digits;
    if (d.startsWith('33')) d = '0' + d.slice(2);
    if (d.length === 10) {
      const prefix = cleanStr.startsWith('+33') ? '+33 ' + d[1] : d.slice(0, 2);
      return `${prefix} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)} **`;
    }
  }

  // Suisse (+41)
  if (cleanStr.startsWith('+41') || /^41\d{9}$/.test(digits)) {
    const d = digits.startsWith('41') ? digits.slice(2) : digits;
    if (d.length === 9) {
      return `+41 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} **`;
    }
  }

  // Belgique (+32)
  if (cleanStr.startsWith('+32') || /^32\d{8,9}$/.test(digits)) {
    const d = digits.startsWith('32') ? digits.slice(2) : digits;
    if (d.length >= 8) {
      return `+32 ${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} **`;
    }
  }

  // Fallback général : masquer les 2 derniers chiffres
  let count = 0;
  const chars = trimmed.split('');
  for (let i = chars.length - 1; i >= 0; i--) {
    if (/\d/.test(chars[i])) {
      chars[i] = '*';
      count++;
      if (count === 2) break;
    }
  }
  return chars.join('');
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
    const contactMasked = formatContact(item.contact).toLowerCase();

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
        contactMasked.includes(pLower) ||
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

/* 1. En-tête : Logo à gauche (même hauteur que les boutons et montant réunis), Contrôles en haut à droite, Somme en dessous */
.hero-top-header {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  gap: 1.5rem;
  flex-shrink: 0;
}

.logo-hero-side {
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  align-self: stretch;
  flex: 0 0 auto;
  max-width: 52%;
}

.header-logo-hero {
  height: 100%;
  min-height: 165px;
  max-height: 185px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
  object-position: left center;
  transition: filter 0.2s ease, height 0.2s ease;
  user-select: none;
}

.stats-controls-side {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-end;
  text-align: right;
  align-self: stretch;
  flex-shrink: 0;
  padding: 0;
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

.index-col {
  width: 3.5rem;
  min-width: 3rem;
  max-width: 4rem;
  text-align: center !important;
  padding-left: 0.5rem !important;
  padding-right: 0.5rem !important;
}

.row-index-badge {
  font-weight: 700;
  font-size: 0.88rem;
  color: #737373;
  font-variant-numeric: tabular-nums;
  display: inline-block;
}

html.dark .row-index-badge,
body.dark .row-index-badge,
.dark .row-index-badge {
  color: #a3a3a3;
}

.name-cell {
  font-weight: 800;
  font-size: 0.95rem;
  text-transform: uppercase !important;
  letter-spacing: 0.02em;
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
  font-weight: 600;
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.03em;
  white-space: nowrap !important;
}

.somme-col {
  white-space: nowrap !important;
}

.somme-cell {
  font-weight: 800;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap !important;
  display: inline-block;
  word-break: keep-all;
}

/* 4. Section Remarques (Fanamarihana) : couleur gris tête de colonnes, texte bien noir, scrollable sans scrollbar avec dégradé opacité 0 */
.remarques-section {
  flex-shrink: 0;
  background: #efefef;
  border-radius: 14px;
  border: 1px solid #e0e0e0;
  padding: 0.65rem 1rem 0.55rem;
  margin-top: 0;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

html.dark .remarques-section,
body.dark .remarques-section,
.dark .remarques-section {
  background: #202020 !important;
  border-color: #2e2e2e !important;
}

.remarques-header {
  margin-bottom: 0.35rem;
}

.remarques-heading {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #000000 !important;
}

html.dark .remarques-heading,
body.dark .remarques-heading,
.dark .remarques-heading {
  color: #ffffff !important;
}

.remarques-scroll-box {
  max-height: 85px;
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
  color: #000000 !important;
}

html.dark .remarque-point,
body.dark .remarque-point,
.dark .remarque-point {
  color: #ffffff !important;
}

.bullet-dot {
  font-size: 1.15rem;
  line-height: 1.3;
  flex-shrink: 0;
  color: #000000 !important;
}

html.dark .bullet-dot,
body.dark .bullet-dot,
.dark .bullet-dot {
  color: #ffffff !important;
}

.remarque-text {
  flex: 1;
  color: #000000 !important;
  font-weight: 600;
}

html.dark .remarque-text,
body.dark .remarque-text,
.dark .remarque-text {
  color: #ffffff !important;
  font-weight: 500;
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
    height: 100%;
    min-height: 145px;
    max-height: 160px;
  }

  .total-amount {
    font-size: 2.85rem;
  }

  .remarques-scroll-box {
    max-height: 80px;
  }
}

/* ======================================================== */
/* RESPONSIVE : MOBILE (< 640px)                           */
/* ======================================================== */
@media (max-width: 640px) {
  .clean-page-container {
    padding: 0.45rem 0.65rem 0.35rem;
    gap: 0.5rem;
  }

  /* L'en-tête en ligne : Logo TOUT À GAUCHE et Somme TOUT À DROITE */
  .hero-top-header {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: space-between;
    width: 100%;
    min-height: auto;
    padding: 0;
    gap: 0.65rem;
  }

  /* Logo agrandi pour avoir la MÊME HAUTEUR que le bloc de droite (boutons + montant total) */
  .logo-hero-side {
    display: flex;
    align-items: stretch;
    justify-content: flex-start;
    align-self: stretch;
    flex: 0 0 auto;
    max-width: 50%;
  }

  .header-logo-hero {
    height: 100%;
    min-height: 124px;
    max-height: 135px;
    width: auto;
    max-width: 100%;
    object-fit: contain;
    object-position: left center;
  }

  /* Contrôles et Somme tout à droite */
  .stats-controls-side {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    text-align: right;
    align-self: stretch;
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

  /* Somme totale pour mobile */
  .total-compact-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    width: 100%;
    margin-top: auto;
    padding-top: 0.15rem;
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
    font-size: clamp(1.8rem, 6.5vw, 2.35rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  /* Réduction de la hauteur du tableau sur mobile */
  .table-wrapper {
    flex: 0 1 auto;
    height: 38dvh;
    max-height: 38dvh;
    min-height: 150px;
  }

  .name-cell,
  .somme-cell {
    font-size: 0.88rem;
  }

  .prenom-cell,
  .contact-cell {
    font-size: 0.84rem;
  }

  /* Remarques (Fanamarihana) sur mobile : fond gris, texte bien noir, scrollable avec dégradé */
  .remarques-section {
    padding: 0.55rem 0.85rem 0.45rem;
    border-radius: 12px;
  }

  .remarques-heading {
    font-size: 0.85rem;
    font-weight: 800;
    margin-bottom: 0.25rem;
  }

  .remarques-scroll-box {
    max-height: 75px;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 18px), transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 18px), transparent 100%);
  }

  .remarque-point {
    font-size: 0.82rem;
    gap: 0.45rem;
    line-height: 1.4;
  }
}
</style>
