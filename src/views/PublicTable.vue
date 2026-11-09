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

    <!-- 2. Compte à rebours fin de collecte & Barre de recherche -->
    <div class="search-section-wrapper">
      <div class="countdown-banner">
        <span class="countdown-text">{{ countdownDisplay }}</span>
      </div>
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
          <div class="empty-state" v-if="!loading">
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
            <i class="pi pi-spin pi-spinner loading-spinner-icon"></i>
            <span class="loading-text">{{ $t('loading') }}</span>
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
            <span class="bullet-dash">–</span>
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

const { locale, t } = useI18n();

// Compte à rebours fin de collecte : Mercredi 18 novembre 2026 à 06h00 (Madagascar UTC+3)
const TARGET_END_DATE = new Date('2026-11-18T06:00:00+03:00').getTime();
const countdownDisplay = ref('');
let countdownInterval = null;

const updateCountdown = () => {
  const diff = TARGET_END_DATE - Date.now();
  const dayUnit = locale.value === 'en' ? 'd' : 'j';

  if (diff <= 0) {
    const zeroTime = `0${dayUnit} 00h 00m 00s`;
    countdownDisplay.value = t('countdown_text', { time: zeroTime });
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const formattedTime = `${days}${dayUnit} ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  countdownDisplay.value = t('countdown_text', { time: formattedTime });
};

watch(locale, () => {
  updateCountdown();
});

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
    const anonFirstname = (t('anonymous_firstname') || 'Prénom anonyme').toLowerCase();
    const prenom = (item.prenom || anonFirstname).toLowerCase();
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
  const savedTheme = localStorage.getItem('collecte_theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
  checkDarkMode();
  loadData();
  loadRemarques();

  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);

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
  if (countdownInterval) {
    clearInterval(countdownInterval);
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
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* 1. En-tête : Logo à gauche (agrandi), Contrôles en haut à droite, Somme juste en dessous avec distance considérablement réduite */
.hero-top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  gap: 1.5rem;
  flex-shrink: 0;
}

.logo-hero-side {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: 1 1 auto;
  min-width: 0;
}

.header-logo-hero {
  height: clamp(85px, 7.5vw, 110px);
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
  justify-content: center;
  align-items: flex-end;
  text-align: right;
  gap: 0.75rem; /* Léger espacement équilibré entre boutons et somme */
  flex: 0 0 auto;
  padding: 0;
  margin-right: 0.65rem; /* Léger margin right aux boutons et somme totale */
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

.dark .theme-btn {
  background: #242424 !important;
  color: #f3f3f3 !important;
}

.dark .theme-btn:hover {
  background: #303030 !important;
  color: #ffffff !important;
}

.total-compact-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  margin-top: 0.35rem; /* Léger margin avec les boutons au-dessus */
  padding-top: 0;
}

.total-label {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.15rem;
}

/* Somme totale : taille légèrement réduite */
.total-amount {
  font-size: 2.85rem;
  font-weight: 900;
  letter-spacing: -0.025em;
  line-height: 1.05;
  transition: color 0.2s ease;
  white-space: nowrap;
}

/* 2. Barre de recherche & Compte à rebours fin de collecte */
.search-section-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  margin: 0;
  padding: 0;
}

.countdown-banner {
  width: fit-content;
  max-width: 100%;
  background: #000000 !important;
  color: #ffffff !important;
  border-top-left-radius: 14px;
  border-top-right-radius: 14px;
  border-bottom-left-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  padding: 0.28rem 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 700;
  font-size: 0.82rem;
  letter-spacing: 0.03em;
  line-height: 1.25;
  box-sizing: border-box;
  user-select: none;
  z-index: 2;
  margin: 0 auto;
}

.countdown-text {
  color: #ffffff !important;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
}

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
  position: relative;
}

.table-wrapper :deep(.p-datatable) {
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative !important;
}

.table-wrapper :deep(.p-datatable-table-container) {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
  position: relative !important;
}

/* Overlay de chargement : empêche totalement la superposition avec les résultats et centre l'indicateur */
.table-wrapper :deep(.p-datatable-mask),
.table-wrapper :deep(.p-overlay-mask) {
  position: absolute !important;
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 100 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

html.dark .table-wrapper :deep(.p-datatable-mask),
body.dark .table-wrapper :deep(.p-datatable-mask),
.dark .table-wrapper :deep(.p-datatable-mask) {
  background: rgba(18, 18, 18, 0.96) !important;
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

/* 4. Section Remarques (Fanamarihana) : couleur gris tête de colonnes, sans bordure, texte bien noir, interligne aéré */
.remarques-section {
  flex-shrink: 0;
  background: #efefef !important;
  border-radius: 15px;
  border: none !important;
  padding: 1.15rem 1.25rem 0.75rem; /* Padding top augmenté */
  margin-top: 1vh;
  transition: background-color 0.2s ease;
}

html.dark .remarques-section,
body.dark .remarques-section,
.dark .remarques-section {
  background: #202020 !important;
  border: none !important;
}

.remarques-header {
  margin-bottom: 0.45rem;
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
  max-height: 115px;
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
  gap: 0.6rem;
}

.remarque-point {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  font-size: 0.95rem;
  line-height: 1.65;
  word-break: break-word;
  color: #000000 !important;
}

html.dark .remarque-point,
body.dark .remarque-point,
.dark .remarque-point {
  color: #ffffff !important;
}

.bullet-dash,
.bullet-dot {
  font-size: 0.95rem;
  line-height: 1.65; /* Aligné exactement sur la hauteur de ligne du texte */
  font-weight: 700;
  flex-shrink: 0;
  user-select: none;
  color: #000000 !important;
}

html.dark .bullet-dash,
html.dark .bullet-dot,
body.dark .bullet-dash,
body.dark .bullet-dot,
.dark .bullet-dash,
.dark .bullet-dot {
  color: #ffffff !important;
}

.remarque-text {
  flex: 1;
  color: #000000 !important;
  font-weight: 600;
  line-height: 1.65;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.95rem 1.6rem;
  background: #ffffff;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
  font-weight: 600;
  font-size: 0.92rem;
  line-height: 1.4 !important;
  color: #171717 !important;
  max-width: 90%;
  margin: auto;
}

.loading-spinner-icon {
  font-size: 1.25rem !important;
  color: #171717 !important;
  display: inline-block;
  line-height: 1 !important;
  flex-shrink: 0;
}

.loading-text {
  line-height: 1.4 !important;
  margin: 0;
  display: inline-block;
}

html.dark .loading-state,
body.dark .loading-state,
.dark .loading-state {
  background: #222222 !important;
  border-color: #333333 !important;
  color: #f3f3f3 !important;
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5) !important;
}

html.dark .loading-spinner-icon,
body.dark .loading-spinner-icon,
.dark .loading-spinner-icon {
  color: #ffffff !important;
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
    height: clamp(155px, 18vw, 185px);
    width: auto;
    max-width: 100%;
    object-fit: contain;
    object-position: left center;
  }

  .stats-controls-side {
    gap: 0.6rem;
    margin-right: 0.55rem;
  }

  .total-compact-box {
    margin-top: 0.25rem;
    padding-top: 0;
  }

  .total-amount {
    font-size: 2.35rem;
  }

  .remarques-scroll-box {
    max-height: 100px;
  }
}

/* ======================================================== */
/* RESPONSIVE : MOBILE (< 640px)                           */
/* ======================================================== */
@media (max-width: 640px) {
  .countdown-banner {
    padding: 0.22rem 0.65rem;
    font-size: 0.76rem;
    border-top-left-radius: 14px;
    border-top-right-radius: 14px;
  }

  .clean-page-container {
    padding: 0.45rem 0.65rem 0.35rem;
    gap: 0.5rem;
  }

  /* L'en-tête en ligne : Logo TOUT À GAUCHE et Somme TOUT À DROITE */
  .hero-top-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: auto;
    padding: 0;
    gap: 0.5rem;
  }

  /* Logo encore agrandi pour la version mobile */
  .logo-hero-side {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex: 1 1 auto;
    min-width: 0;
  }

  .header-logo-hero {
    height: clamp(126px, 33vw, 152px);
    width: auto;
    max-width: 100%;
    object-fit: contain;
    object-position: left center;
  }

  /* Contrôles et Somme tout à droite : léger espacement équilibré */
  .stats-controls-side {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    text-align: right;
    gap: 0.45rem; /* Léger gap entre boutons et somme */
    flex: 0 0 auto;
    min-width: 0;
    padding: 0;
    margin-right: 0.5rem; /* Léger margin right aux boutons et somme totale en mobile */
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

  /* Somme totale pour mobile : léger margin et taille légèrement réduite */
  .total-compact-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    text-align: right;
    width: 100%;
    margin-top: 0.2rem; /* Léger margin */
    padding-top: 0;
  }

  .total-label {
    font-size: 0.68rem;
    letter-spacing: 0.04em;
    margin-bottom: 0.05rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* Taille du texte de la somme légèrement réduite sur mobile */
  .total-amount {
    font-size: clamp(1.55rem, 5.8vw, 2.05rem);
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }

  /* Tableau : remplit tout l'espace disponible sans laisser de vide en bas */
  .table-wrapper {
    flex: 1 1 0;
    min-height: 140px;
  }

  .name-cell,
  .somme-cell {
    font-size: 0.88rem;
  }

  .prenom-cell,
  .contact-cell {
    font-size: 0.84rem;
  }

  /* Remarques (Fanamarihana) sur mobile : fond gris, sans bordure, texte bien noir, scrollable avec dégradé */
  .remarques-section {
    padding: 0.95rem 0.95rem 0.40rem; /* Padding top augmenté */
    border-radius: 14px;
    border: none !important;
  }

  .remarques-heading {
    font-size: 0.88rem;
    font-weight: 800;
    margin-bottom: 0.35rem;
  }

  .remarques-scroll-box {
    max-height: 95px;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 18px), transparent 100%);
    mask-image: linear-gradient(to bottom, #000 0%, #000 calc(100% - 18px), transparent 100%);
  }

  .remarque-point {
    font-size: 0.84rem;
    gap: 0.5rem;
    line-height: 1.5;
  }

  .bullet-dash,
  .bullet-dot {
    font-size: 0.84rem;
    line-height: 1.5;
  }
}
</style>
