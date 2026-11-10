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
            <div class="total-odometer-flow">
              <template v-for="item in sommeDisplaySlots" :key="item.key">
                <span v-if="item.isSpacer" class="odometer-spacer"></span>
                <RollingDigit 
                  v-else 
                  :value="item.digit" 
                  :slot-width="'0.62em'"
                  :slot-height="'1.15em'"
                />
              </template>
              <span class="currency-suffix">Ar</span>
            </div>
          </h1>
        </div>
      </div>
    </header>

    <!-- 2. Compte à rebours fin de collecte & Barre de recherche -->
    <div class="search-section-wrapper">
      <div class="countdown-banner">
        <span v-if="isCountdownEnded" class="countdown-text">
          {{ $t('countdown_ended') }}
        </span>
        <div v-else class="countdown-inner-flow">
          <span class="countdown-prefix">{{ countdownPrefix }}</span>
          <div class="countdown-digits-cluster">
            <!-- Jours -->
            <span class="countdown-unit-cluster">
              <RollingDigit 
                v-for="(d, idx) in dayDigits" 
                :key="'d-' + (dayDigits.length - 1 - idx)" 
                :value="d"
              />
              <span class="countdown-letter">{{ dayUnit }}</span>
            </span>

            <!-- Heures -->
            <span class="countdown-unit-cluster">
              <RollingDigit :value="hourDigits[0]" key="h-tens" />
              <RollingDigit :value="hourDigits[1]" key="h-ones" />
              <span class="countdown-letter">h</span>
            </span>

            <!-- Minutes -->
            <span class="countdown-unit-cluster">
              <RollingDigit :value="minDigits[0]" key="m-tens" />
              <RollingDigit :value="minDigits[1]" key="m-ones" />
              <span class="countdown-letter">m</span>
            </span>

            <!-- Secondes -->
            <span class="countdown-unit-cluster">
              <RollingDigit :value="secDigits[0]" key="s-tens" />
              <RollingDigit :value="secDigits[1]" key="s-ones" />
              <span class="countdown-letter">s</span>
            </span>
          </div>
          <span v-if="countdownSuffix" class="countdown-suffix">{{ countdownSuffix }}</span>
        </div>
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

        <!-- Colonne Date d'enregistrement (Daty nampidirana) -->
        <Column field="createdAt" :header="$t('date_saisie')" sortable class="date-col" style="white-space: nowrap;">
          <template #body="slotProps">
            <div class="date-cell">
              {{ formatDate(slotProps.data.createdAt || slotProps.data.date) }}
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
        <span class="remarque-transfert-badge">
          {{ $t('remarque_transfert_rappel') }}
        </span>
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
import RollingDigit from '@/components/RollingDigit.vue';
import logoSvg from '@/assets/logo.svg';

const { locale, t } = useI18n();

// Compte à rebours fin de collecte : Mercredi 18 novembre 2026 à 18h00 (Madagascar UTC+3)
const TARGET_END_DATE = new Date('2026-11-18T18:00:00+03:00').getTime();
const isCountdownEnded = ref(false);
const daysLeft = ref(0);
const hoursLeft = ref(0);
const minutesLeft = ref(0);
const secondsLeft = ref(0);

const dayDigits = computed(() => {
  return String(daysLeft.value).split('').map(Number);
});

const hourDigits = computed(() => {
  const h = Math.max(0, hoursLeft.value);
  return [Math.floor(h / 10), h % 10];
});

const minDigits = computed(() => {
  const m = Math.max(0, minutesLeft.value);
  return [Math.floor(m / 10), m % 10];
});

const secDigits = computed(() => {
  const s = Math.max(0, secondsLeft.value);
  return [Math.floor(s / 10), s % 10];
});

const dayUnit = computed(() => (locale.value === 'en' ? 'd' : 'j'));

const countdownPrefix = computed(() => {
  const raw = t('countdown_text', { time: '___TIME___' });
  const parts = raw.split('___TIME___');
  return parts[0] || '';
});

const countdownSuffix = computed(() => {
  const raw = t('countdown_text', { time: '___TIME___' });
  const parts = raw.split('___TIME___');
  return parts[1] || '';
});

let countdownInterval = null;

const updateCountdown = () => {
  const diff = TARGET_END_DATE - Date.now();

  if (diff <= 0) {
    isCountdownEnded.value = true;
    daysLeft.value = 0;
    hoursLeft.value = 0;
    minutesLeft.value = 0;
    secondsLeft.value = 0;
    return;
  }

  isCountdownEnded.value = false;
  daysLeft.value = Math.floor(diff / (1000 * 60 * 60 * 24));
  hoursLeft.value = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  minutesLeft.value = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  secondsLeft.value = Math.floor((diff % (1000 * 60)) / 1000);
};

// Variables du template
const products = ref([]);
const value2 = ref('');
const isSearchFocused = ref(false);
const loading = ref(false);
const totalSomme = ref(0);
const totalCount = ref(0);

// Suivi de la dernière somme vue par l'utilisateur pour l'odomètre
const LAST_SEEN_SOMME_KEY = 'collecte_last_seen_somme';
const lastSeenSomme = ref(null);
const displayedSomme = ref(0);
const targetSommeLen = ref(7); // Par défaut 7 chiffres (ex: 2 125 000)
let hasInitializedSomme = false;

try {
  const saved = localStorage.getItem(LAST_SEEN_SOMME_KEY);
  if (saved !== null && saved !== '' && !isNaN(Number(saved))) {
    lastSeenSomme.value = Number(saved);
    targetSommeLen.value = Math.max(1, String(Math.round(Number(saved))).length);
  }
} catch (e) {
  console.warn('localStorage non accessible:', e);
}

const sommeDisplaySlots = computed(() => {
  const str = String(Math.max(0, Math.round(displayedSomme.value)));
  const len = Math.max(str.length, targetSommeLen.value);
  const padded = str.padStart(len, '0');

  const slots = [];
  for (let i = 0; i < len; i++) {
    const digit = parseInt(padded[i], 10);
    const distFromRight = len - 1 - i;
    slots.push({ isSpacer: false, digit, key: 'pos-' + distFromRight });
    if (distFromRight > 0 && distFromRight % 3 === 0) {
      slots.push({ isSpacer: true, key: 'space-' + distFromRight });
    }
  }
  return slots;
});

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

// Formatage de la date d'enregistrement
// Format demandé : "00 Nov/18h30m" (mg, fr), "Nov 00/ 6:30pm" (en)
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';

  const day = String(d.getDate()).padStart(2, '0');
  const hours24 = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  const mgMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'Mey', 'Jon', 'Jol', 'Aog', 'Sep', 'Okt', 'Nov', 'Des'];
  const frMonths = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthIdx = d.getMonth();

  if (locale.value === 'en') {
    const month = enMonths[monthIdx];
    let h = d.getHours();
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    h = h ? h : 12;
    return `${month} ${day}/ ${h}:${minutes}${ampm}`;
  }

  const month = locale.value === 'fr' ? frMonths[monthIdx] : mgMonths[monthIdx];
  return `${day} ${month}/${hours24}h${minutes}m`;
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
    const newTotal = response.totalSomme || 0;
    totalSomme.value = newTotal;
    totalCount.value = response.totalCount || 0;

    const newLen = String(newTotal).length;

    if (!hasInitializedSomme) {
      hasInitializedSomme = true;
      // À chaque chargement / rechargement de page, on déclenche l'animation de roulement vers la somme
      targetSommeLen.value = newLen;
      displayedSomme.value = 0;
      setTimeout(() => {
        displayedSomme.value = newTotal;
        try {
          localStorage.setItem(LAST_SEEN_SOMME_KEY, String(newTotal));
        } catch (e) {}
      }, 120);
    } else {
      // Déjà initialisé durant la session courante : si la somme globale évolue
      if (displayedSomme.value !== newTotal) {
        targetSommeLen.value = Math.max(targetSommeLen.value, newLen);
        displayedSomme.value = newTotal;
        try {
          localStorage.setItem(LAST_SEEN_SOMME_KEY, String(newTotal));
        } catch (e) {}
      }
    }
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
    const dateFormatted = formatDate(item.createdAt || item.date).toLowerCase();

    return parts.every((p) => {
      const pLower = p.toLowerCase();
      const pCleanDigits = pLower.replace(/\s+/g, '');

      if (pLower === 'd') {
        return /\d/.test(contactRaw) || nom.includes('d') || prenom.includes('d') || dateFormatted.includes('d');
      }

      return (
        nom.includes(pLower) ||
        prenom.includes(pLower) ||
        contactRaw.includes(pLower) ||
        contactMasked.includes(pLower) ||
        dateFormatted.includes(pLower) ||
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

.total-odometer-flow {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  white-space: nowrap;
}

.odometer-spacer {
  display: inline-block;
  width: 0.35em;
  flex-shrink: 0;
}

.currency-suffix {
  margin-left: 0.28em;
  font-size: 0.88em;
  font-weight: 800;
  display: inline-block;
  flex-shrink: 0;
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
  border-top-left-radius: 9px;
  border-top-right-radius: 9px;
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

.countdown-inner-flow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.countdown-prefix,
.countdown-suffix {
  color: inherit;
  font-weight: inherit;
  white-space: nowrap;
}

.countdown-digits-cluster {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.countdown-unit-cluster {
  display: inline-flex;
  align-items: center;
  gap: 0.02rem;
  white-space: nowrap;
}

.countdown-letter {
  color: inherit;
  font-weight: inherit;
  font-size: inherit;
  margin-left: 0.04rem;
}

.countdown-text {
  color: #ffffff !important;
  font-weight: 700;
  display: inline-block;
  white-space: nowrap;
}

/* Version inversée en dark mode pour le compte à rebours : fond blanc et texte noir */
html.dark .countdown-banner,
body.dark .countdown-banner,
.dark .countdown-banner {
  background: #ffffff !important;
  color: #000000 !important;
}

html.dark .countdown-text,
body.dark .countdown-text,
.dark .countdown-text,
html.dark .countdown-inner-flow,
body.dark .countdown-inner-flow,
.dark .countdown-inner-flow,
html.dark .countdown-prefix,
body.dark .countdown-prefix,
.dark .countdown-prefix,
html.dark .countdown-digits-cluster,
body.dark .countdown-digits-cluster,
.dark .countdown-digits-cluster,
html.dark .countdown-unit-cluster,
body.dark .countdown-unit-cluster,
.dark .countdown-unit-cluster,
html.dark .countdown-letter,
body.dark .countdown-letter,
.dark .countdown-letter {
  color: #000000 !important;
  font-weight: 800 !important;
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

.date-col {
  white-space: nowrap !important;
}

.date-cell {
  font-weight: 600;
  font-size: 0.90rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
  white-space: nowrap !important;
  color: #555555;
}

body.dark .date-cell,
.dark .date-cell {
  color: #cccccc !important;
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
  display: flex;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
  margin-bottom: 0.45rem;
}

.remarques-heading {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #000000 !important;
  margin: 0;
}

.remarque-transfert-badge {
  background: #000000 !important;
  color: #ffffff !important;
  border-radius: 0 !important; /* pas de radius */
  padding: 0.2rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  user-select: none;
  box-sizing: border-box;
}

/* Version inversée en dark mode pour le badge transfert : fond blanc et texte noir, pas de radius */
html.dark .remarque-transfert-badge,
body.dark .remarque-transfert-badge,
.dark .remarque-transfert-badge {
  background: #ffffff !important;
  color: #000000 !important;
  border: none !important;
  border-radius: 0 !important;
  font-weight: 800 !important;
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
    padding: 0.22rem 0.85rem;
    font-size: 0.76rem;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .countdown-digits-cluster {
    gap: 0.22rem;
  }

  .countdown-inner-flow {
    gap: 0.18rem;
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
  .contact-cell,
  .date-cell {
    font-size: 0.84rem;
  }

  /* Remarques (Fanamarihana) sur mobile : fond gris, sans bordure, texte bien noir, scrollable avec dégradé */
  .remarques-section {
    padding: 0.95rem 0.95rem 0.40rem; /* Padding top augmenté */
    border-radius: 14px;
    border: none !important;
  }

  .remarques-header {
    gap: 0.35rem;
    margin-bottom: 0.35rem;
  }

  .remarques-heading {
    font-size: 0.88rem;
    font-weight: 800;
    margin: 0;
  }

  .remarque-transfert-badge {
    font-size: 0.72rem;
    padding: 0.16rem 0.45rem;
    border-radius: 0 !important;
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
