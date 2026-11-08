<template>
    <div class="saisi-page-container">
        <!-- 1. ÉCRAN DE CONNEXION (Si non connecté) -->
        <div v-if="!isAuthenticated" class="login-wrapper">
            <div class="login-card">
                <div class="login-header">
                    <div class="lock-circle">
                        <i class="pi pi-lock"></i>
                    </div>
                    <h2 class="login-title">{{ $t('login_title') }}</h2>
                    <p class="login-subtitle">{{ $t('login_desc') }}</p>
                </div>

                <form @submit.prevent="handleLogin" class="login-form">
                    <div class="form-group">
                        <label for="username">{{ $t('username') }}</label>
                        <div class="input-with-icon">
                            <i class="pi pi-user"></i>
                            <InputText 
                                id="username" 
                                v-model="loginForm.username" 
                                :placeholder="$t('username')" 
                                class="w-full"
                                required 
                            />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="password">{{ $t('password') }}</label>
                        <div class="input-with-icon">
                            <i class="pi pi-key"></i>
                            <InputText 
                                id="password" 
                                type="password" 
                                v-model="loginForm.password" 
                                placeholder="••••••••••••" 
                                class="w-full"
                                required 
                            />
                        </div>
                    </div>

                    <div v-if="loginError" class="error-banner">
                        <i class="pi pi-exclamation-triangle"></i>
                        <span>{{ loginError }}</span>
                    </div>

                    <Button 
                        type="submit" 
                        :label="$t('btn_login')" 
                        icon="pi pi-sign-in" 
                        :loading="loginLoading" 
                        class="w-full submit-btn" 
                    />
                </form>
            </div>
        </div>

        <!-- 2. ESPACE DE SAISIE DE DONNÉES (Si connecté) -->
        <div v-else class="saisi-section">
            <!-- Barre session admin (Style monochrome épuré) -->
            <div class="admin-topbar">
                <div class="admin-user-info">
                    <span class="user-avatar-tag">
                        <i class="pi pi-shield"></i>
                    </span>
                    <div>
                        <h3 class="user-welcome"><strong>{{ currentUser.username }}</strong></h3>
                    </div>
                </div>

                <div class="topbar-actions">
                    <router-link to="/" class="view-public-btn">
                        <i class="pi pi-table"></i>
                        <span>{{ $t('back_to_table') }}</span>
                    </router-link>
                    <button @click="handleLogout" class="logout-btn">
                        <i class="pi pi-power-off"></i>
                        <span>{{ $t('logout') }}</span>
                    </button>
                </div>
            </div>

            <!-- Formulaire de saisie d'un nouveau don (Sans champ remarque, prénom facultatif) -->
            <div class="form-card mt-6">
                <div class="card-header-flex">
                    <div>
                        <h2 class="form-main-title">
                            <i class="pi pi-plus-circle"></i>
                            {{ $t('new_donation') }}
                        </h2>
                        <p class="form-main-subtitle">{{ $t('new_donation_desc') }}</p>
                    </div>
                </div>

                <form @submit.prevent="handleSaveDonation" class="saisi-form mt-4">
                    <div class="form-grid">
                        <!-- Nom (Obligatoire) -->
                        <div class="form-field">
                            <label for="don_nom" class="required-label">{{ $t('col_nom') }}</label>
                            <InputText 
                                id="don_nom" 
                                v-model="donationForm.nom" 
                                placeholder="Ex: RAHARINDRANTO" 
                                class="w-full"
                                required 
                            />
                        </div>

                        <!-- Prénom (Facultatif - sans étoile, sans required) -->
                        <div class="form-field">
                            <label for="don_prenom">{{ $t('col_prenom') }}</label>
                            <InputText 
                                id="don_prenom" 
                                v-model="donationForm.prenom" 
                                placeholder="Ex: Jean Luc (Optionnel)" 
                                class="w-full"
                            />
                        </div>

                        <!-- Contact (Obligatoire) -->
                        <div class="form-field">
                            <label for="don_contact" class="required-label">{{ $t('col_contact') }}</label>
                            <InputText 
                                id="don_contact" 
                                v-model="donationForm.contact" 
                                placeholder="Ex: 034 12 345 67" 
                                class="w-full"
                                required 
                            />
                        </div>

                        <!-- Somme en Ariary (Obligatoire) -->
                        <div class="form-field">
                            <label for="don_somme" class="required-label">{{ $t('col_somme') }}</label>
                            <div class="somme-input-container">
                                <InputNumber 
                                    id="don_somme" 
                                    v-model="donationForm.somme" 
                                    placeholder="50000" 
                                    class="w-full" 
                                    :min="0"
                                    locale="fr-FR"
                                    required 
                                />
                                <span class="somme-addon">Ar</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-footer mt-6">
                        <Button 
                            type="submit" 
                            :label="$t('save_donation')" 
                            icon="pi pi-check" 
                            :loading="saveLoading" 
                            class="submit-donation-btn" 
                        />
                        <button type="button" @click="resetForm" class="reset-btn">
                            <i class="pi pi-refresh"></i> {{ $t('reset') }}
                        </button>
                    </div>
                </form>
            </div>

            <!-- Historique des saisies enregistrées -->
            <div class="recent-table-card mt-6">
                <div class="card-header-flex">
                    <div>
                        <h3 class="table-title">{{ $t('recent_donations') }}</h3>
                        <p class="table-subtitle">{{ $t('recent_donations_desc') }}</p>
                    </div>
                    <button @click="loadAdminDonations" class="refresh-table-btn" title="Actualiser">
                        <i class="pi pi-sync"></i>
                    </button>
                </div>

                <div class="w-full mt-4 table-responsive-wrapper">
                    <DataTable 
                        :value="adminDonations" 
                        tableStyle="min-width: 44rem"
                        paginator 
                        :rows="5"
                        :rowsPerPageOptions="[5, 10, 20]"
                        responsiveLayout="scroll"
                        stripedRows
                    >
                        <Column header="" class="index-col" style="width: 3.5rem; text-align: center;">
                            <template #body="slotProps">
                                <span class="row-index-badge">{{ slotProps.index + 1 }}</span>
                            </template>
                        </Column>
                        <Column field="nom" :header="$t('col_nom')" sortable>
                            <template #body="slotProps">
                                <span class="name-cell">{{ (slotProps.data.nom || '').toUpperCase() }}</span>
                            </template>
                        </Column>
                        <Column field="prenom" :header="$t('col_prenom')" sortable>
                            <template #body="slotProps">
                                <span class="prenom-cell" :class="{ 'prenom-anonyme': !slotProps.data.prenom || !slotProps.data.prenom.trim() }">
                                    {{ slotProps.data.prenom && slotProps.data.prenom.trim() ? slotProps.data.prenom : ($t('anonymous_firstname') || 'Prénom anonyme') }}
                                </span>
                            </template>
                        </Column>
                        <Column field="contact" :header="$t('col_contact')" sortable>
                            <template #body="slotProps">
                                <span class="contact-cell">{{ slotProps.data.contact }}</span>
                            </template>
                        </Column>
                        <Column field="somme" :header="$t('col_somme')" sortable style="white-space: nowrap;">
                            <template #body="slotProps">
                                <span class="somme-cell" style="white-space: nowrap !important;">{{ formatSomme(slotProps.data.somme) }}</span>
                            </template>
                        </Column>
                        <Column field="createdAt" :header="$t('date_saisie')" sortable>
                            <template #body="slotProps">
                                <span class="date-cell">{{ formatDate(slotProps.data.createdAt) }}</span>
                            </template>
                        </Column>
                        <Column :header="$t('actions')" style="width: 100px; text-align: center;">
                            <template #body="slotProps">
                                <div class="actions-group">
                                    <button 
                                        @click="openEditDonation(slotProps.data)" 
                                        class="edit-action-btn" 
                                        :title="$i18n.locale === 'mg' ? 'Hanova' : ($i18n.locale === 'en' ? 'Edit' : 'Modifier')"
                                    >
                                        <i class="pi pi-pencil"></i>
                                    </button>
                                    <button 
                                        @click="deleteDonation(slotProps.data._id)" 
                                        class="delete-action-btn" 
                                        :title="$i18n.locale === 'mg' ? 'Hamafa' : ($i18n.locale === 'en' ? 'Delete' : 'Supprimer')"
                                    >
                                        <i class="pi pi-trash"></i>
                                    </button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- GESTION DES REMARQUES PAR LANGUE -->
            <div class="form-card mt-6">
                <div class="card-header-flex">
                    <div>
                        <h2 class="form-main-title">
                            <i class="pi pi-list"></i>
                            {{ $t('manage_remarques') }}
                        </h2>
                        <p class="form-main-subtitle">{{ $t('manage_remarques_desc') }}</p>
                    </div>
                </div>

                <!-- Formulaire d'ajout d'une remarque avec champs par langue -->
                <form @submit.prevent="handleSaveRemarque" class="saisi-form mt-4">
                    <div class="form-grid">
                        <div class="form-field col-span-2">
                            <label for="remarque_mg" class="required-label">{{ $t('remarque_mg') }}</label>
                            <InputText 
                                id="remarque_mg" 
                                v-model="remarqueForm.texte_mg" 
                                placeholder="Ex: Natokana tanteraka hanampiana ireo tanora ny vola voaangona." 
                                class="w-full"
                                required 
                            />
                        </div>

                        <div class="form-field">
                            <label for="remarque_fr">{{ $t('remarque_fr') }}</label>
                            <InputText 
                                id="remarque_fr" 
                                v-model="remarqueForm.texte_fr" 
                                placeholder="Ex: Les fonds sont entièrement reversés au soutien des jeunes." 
                                class="w-full"
                            />
                        </div>

                        <div class="form-field">
                            <label for="remarque_en">{{ $t('remarque_en') }}</label>
                            <InputText 
                                id="remarque_en" 
                                v-model="remarqueForm.texte_en" 
                                placeholder="Ex: All funds are dedicated to supporting the youth." 
                                class="w-full"
                            />
                        </div>
                    </div>

                    <div class="form-footer mt-4">
                        <Button 
                            type="submit" 
                            :label="$t('save_remarque')" 
                            icon="pi pi-plus" 
                            :loading="saveRemarqueLoading" 
                            class="submit-donation-btn" 
                        />
                    </div>
                </form>

                <!-- Liste des remarques enregistrées -->
                <div class="w-full mt-6 table-responsive-wrapper" v-if="adminRemarques && adminRemarques.length > 0">
                    <DataTable 
                        :value="adminRemarques" 
                        tableStyle="min-width: 44rem"
                        responsiveLayout="scroll"
                        stripedRows
                    >
                        <Column field="texte_mg" :header="$t('remarque_mg')" style="width: 32%;">
                            <template #body="slotProps">
                                <span class="remarque-table-text">{{ slotProps.data.texte_mg || '-' }}</span>
                            </template>
                        </Column>
                        <Column field="texte_fr" :header="$t('remarque_fr')" style="width: 32%;">
                            <template #body="slotProps">
                                <span class="remarque-table-text">{{ slotProps.data.texte_fr || '-' }}</span>
                            </template>
                        </Column>
                        <Column field="texte_en" :header="$t('remarque_en')" style="width: 32%;">
                            <template #body="slotProps">
                                <span class="remarque-table-text">{{ slotProps.data.texte_en || '-' }}</span>
                            </template>
                        </Column>
                        <Column :header="$t('actions')" style="width: 100px; text-align: center;">
                            <template #body="slotProps">
                                <div class="actions-group">
                                    <button 
                                        @click="openEditRemarque(slotProps.data)" 
                                        class="edit-action-btn" 
                                        :title="$i18n.locale === 'mg' ? 'Hanova' : ($i18n.locale === 'en' ? 'Edit' : 'Modifier')"
                                    >
                                        <i class="pi pi-pencil"></i>
                                    </button>
                                    <button 
                                        @click="deleteRemarque(slotProps.data._id)" 
                                        class="delete-action-btn" 
                                        :title="$i18n.locale === 'mg' ? 'Hamafa' : ($i18n.locale === 'en' ? 'Delete' : 'Supprimer')"
                                    >
                                        <i class="pi pi-trash"></i>
                                    </button>
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>
        </div>

        <!-- MODALS D'ÉDITION AVEC TELEPORT POUR UN RENDU PARFAIT -->
        <Teleport to="body">
            <!-- Modal Modification Don -->
            <div 
                v-if="isEditDonationModalOpen" 
                class="modal-backdrop" 
                @click.self="closeEditDonationModal"
            >
                <div class="modal-card">
                    <div class="modal-header">
                        <div class="modal-title-box">
                            <span class="modal-icon-badge">
                                <i class="pi pi-pencil"></i>
                            </span>
                            <div>
                                <h3 class="modal-title">
                                    {{ $i18n.locale === 'mg' ? 'Hanova ny fandraisana anjara' : ($i18n.locale === 'en' ? 'Edit Contribution' : 'Modifier la contribution') }}
                                </h3>
                                <p class="modal-subtitle">
                                    {{ $i18n.locale === 'mg' ? 'Ovay eto ny mombamomba ny mpandray anjara' : ($i18n.locale === 'en' ? 'Update donor details' : 'Modifiez les informations du donateur') }}
                                </p>
                            </div>
                        </div>
                        <button 
                            @click="closeEditDonationModal" 
                            class="modal-close-btn" 
                            type="button" 
                            aria-label="Fermer"
                        >
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <form @submit.prevent="handleUpdateDonation" class="modal-body">
                        <div class="modal-form-grid">
                            <!-- Nom -->
                            <div class="form-field">
                                <label class="required-label">{{ $t('col_nom') }}</label>
                                <InputText 
                                    v-model="editDonationForm.nom" 
                                    :placeholder="$t('col_nom')" 
                                    class="w-full text-uppercase-input" 
                                    required 
                                />
                            </div>

                            <!-- Prénom -->
                            <div class="form-field">
                                <label>
                                    {{ $t('col_prenom') }} 
                                    <span class="optional-hint">({{ $i18n.locale === 'mg' ? 'tsy voatery' : 'facultatif' }})</span>
                                </label>
                                <InputText 
                                    v-model="editDonationForm.prenom" 
                                    :placeholder="$i18n.locale === 'mg' ? 'Ohatra: Marie' : 'Ex: Marie'" 
                                    class="w-full" 
                                />
                            </div>

                            <!-- Contact -->
                            <div class="form-field">
                                <label class="required-label">{{ $t('col_contact') }}</label>
                                <InputText 
                                    v-model="editDonationForm.contact" 
                                    placeholder="034 00 000 00 / +261..." 
                                    class="w-full" 
                                    required 
                                />
                            </div>

                            <!-- Somme -->
                            <div class="form-field">
                                <label class="required-label">{{ $t('col_somme') }} (Ar)</label>
                                <InputNumber 
                                    v-model="editDonationForm.somme" 
                                    mode="decimal" 
                                    :min="0"
                                    suffix=" Ar" 
                                    class="w-full" 
                                    required 
                                />
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button 
                                type="button" 
                                @click="closeEditDonationModal" 
                                class="modal-cancel-btn"
                            >
                                {{ $i18n.locale === 'mg' ? 'Hanafoana' : ($i18n.locale === 'en' ? 'Cancel' : 'Annuler') }}
                            </button>
                            <Button 
                                type="submit" 
                                :label="$i18n.locale === 'mg' ? 'Mandraikitra' : ($i18n.locale === 'en' ? 'Save changes' : 'Enregistrer')" 
                                icon="pi pi-check" 
                                :loading="editDonationLoading" 
                                class="modal-submit-btn" 
                            />
                        </div>
                    </form>
                </div>
            </div>

            <!-- Modal Modification Remarque -->
            <div 
                v-if="isEditRemarqueModalOpen" 
                class="modal-backdrop" 
                @click.self="closeEditRemarqueModal"
            >
                <div class="modal-card">
                    <div class="modal-header">
                        <div class="modal-title-box">
                            <span class="modal-icon-badge">
                                <i class="pi pi-pencil"></i>
                            </span>
                            <div>
                                <h3 class="modal-title">
                                    {{ $i18n.locale === 'mg' ? 'Hanova ny fanamarihana' : ($i18n.locale === 'en' ? 'Edit Remark' : 'Modifier la remarque') }}
                                </h3>
                                <p class="modal-subtitle">
                                    {{ $i18n.locale === 'mg' ? 'Ovay eto ny soratra araka ny fiteny' : ($i18n.locale === 'en' ? 'Update text in each language' : 'Modifiez le texte dans chaque langue') }}
                                </p>
                            </div>
                        </div>
                        <button 
                            @click="closeEditRemarqueModal" 
                            class="modal-close-btn" 
                            type="button" 
                            aria-label="Fermer"
                        >
                            <i class="pi pi-times"></i>
                        </button>
                    </div>

                    <form @submit.prevent="handleUpdateRemarque" class="modal-body">
                        <div class="modal-form-grid-stacked">
                            <!-- Remarque MG -->
                            <div class="form-field">
                                <label class="required-label">{{ $t('remarque_mg') }}</label>
                                <InputText 
                                    v-model="editRemarqueForm.texte_mg" 
                                    placeholder="Fanamarihana amin'ny teny Malagasy..." 
                                    class="w-full" 
                                    required 
                                />
                            </div>

                            <!-- Remarque FR -->
                            <div class="form-field">
                                <label>{{ $t('remarque_fr') }}</label>
                                <InputText 
                                    v-model="editRemarqueForm.texte_fr" 
                                    placeholder="Remarque en Français..." 
                                    class="w-full" 
                                />
                            </div>

                            <!-- Remarque EN -->
                            <div class="form-field">
                                <label>{{ $t('remarque_en') }}</label>
                                <InputText 
                                    v-model="editRemarqueForm.texte_en" 
                                    placeholder="Remark in English..." 
                                    class="w-full" 
                                />
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button 
                                type="button" 
                                @click="closeEditRemarqueModal" 
                                class="modal-cancel-btn"
                            >
                                {{ $i18n.locale === 'mg' ? 'Hanafoana' : ($i18n.locale === 'en' ? 'Cancel' : 'Annuler') }}
                            </button>
                            <Button 
                                type="submit" 
                                :label="$i18n.locale === 'mg' ? 'Mandraikitra' : ($i18n.locale === 'en' ? 'Save changes' : 'Enregistrer')" 
                                icon="pi pi-check" 
                                :loading="editRemarqueLoading" 
                                class="modal-submit-btn" 
                            />
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { DonationService } from '@/service/DonationService';

const toast = useToast();
const { t } = useI18n();

// État d'authentification
const isAuthenticated = ref(false);
const currentUser = ref({ username: '' });
const loginLoading = ref(false);
const loginError = ref('');

const loginForm = reactive({
    username: '',
    password: ''
});

// Formulaire de saisie d'un don (sans champ remarque, prénom facultatif)
const donationForm = reactive({
    nom: '',
    prenom: '',
    contact: '',
    somme: null
});
const saveLoading = ref(false);

// Liste des dons pour l'admin
const adminDonations = ref([]);

// Formulaire pour les remarques par langue
const remarqueForm = reactive({
    texte_fr: '',
    texte_en: '',
    texte_mg: ''
});
const saveRemarqueLoading = ref(false);
const adminRemarques = ref([]);

const loadAdminRemarques = async () => {
    try {
        adminRemarques.value = await DonationService.getRemarques();
    } catch (err) {
        console.error('Erreur chargement admin remarques:', err);
    }
};

const handleSaveRemarque = async () => {
    if (!remarqueForm.texte_mg && !remarqueForm.texte_fr && !remarqueForm.texte_en) {
        toast.add({
            severity: 'warn',
            summary: 'Attention',
            detail: t('fill_required'),
            life: 3000
        });
        return;
    }

    saveRemarqueLoading.value = true;
    try {
        await DonationService.createRemarque({
            texte_mg: remarqueForm.texte_mg,
            texte_fr: remarqueForm.texte_fr,
            texte_en: remarqueForm.texte_en
        });
        toast.add({
            severity: 'success',
            summary: 'OK',
            detail: t('remarque_saved'),
            life: 3000
        });
        remarqueForm.texte_fr = '';
        remarqueForm.texte_en = '';
        remarqueForm.texte_mg = '';
        loadAdminRemarques();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur enregistrement remarque',
            life: 3000
        });
    } finally {
        saveRemarqueLoading.value = false;
    }
};

const deleteRemarque = async (id) => {
    if (!confirm(t('delete_confirm'))) return;
    try {
        await DonationService.deleteRemarque(id);
        toast.add({
            severity: 'info',
            summary: 'OK',
            detail: t('delete_success'),
            life: 3000
        });
        loadAdminRemarques();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur suppression remarque',
            life: 3000
        });
    }
};

// Formatage en Ariary (nowrap)
const formatSomme = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '0\u00A0Ar';
    return new Intl.NumberFormat('fr-MG').format(amount) + '\u00A0Ar';
};

// Formatage date
const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Connexion
const handleLogin = async () => {
    loginError.value = '';
    loginLoading.value = true;
    try {
        const res = await DonationService.login(loginForm.username, loginForm.password);
        if (res.success) {
            isAuthenticated.value = true;
            currentUser.value = res.user;
            localStorage.setItem('collecte_auth_token', res.token);
            localStorage.setItem('collecte_auth_user', JSON.stringify(res.user));
            toast.add({
                severity: 'success',
                summary: 'OK',
                detail: `Bienvenue ${res.user.username}`,
                life: 3000
            });
            loadAdminDonations();
            loadAdminRemarques();
        } else {
            loginError.value = res.message || 'Identifiants invalides.';
        }
    } catch (err) {
        loginError.value = err.response?.data?.message || 'Nom d\'utilisateur ou mot de passe incorrect.';
    } finally {
        loginLoading.value = false;
    }
};

// Déconnexion
const handleLogout = () => {
    isAuthenticated.value = false;
    currentUser.value = { username: '' };
    localStorage.removeItem('collecte_auth_token');
    localStorage.removeItem('collecte_auth_user');
    toast.add({
        severity: 'info',
        summary: 'Info',
        detail: t('logout'),
        life: 2500
    });
};

// Chargement des dons pour l'admin
const loadAdminDonations = async () => {
    try {
        const res = await DonationService.getDonations();
        adminDonations.value = res.data || [];
    } catch (err) {
        console.error('Erreur chargement admin dons:', err);
    }
};

// Enregistrer la saisie (prénom facultatif, sans remarque)
const handleSaveDonation = async () => {
    if (!donationForm.nom || !donationForm.contact || donationForm.somme === null) {
        toast.add({
            severity: 'warn',
            summary: 'Attention',
            detail: t('fill_required'),
            life: 3000
        });
        return;
    }

    saveLoading.value = true;
    try {
        await DonationService.createDonation({
            nom: donationForm.nom,
            prenom: donationForm.prenom ? donationForm.prenom.trim() : '',
            contact: donationForm.contact,
            somme: Number(donationForm.somme)
        });

        toast.add({
            severity: 'success',
            summary: 'Succès',
            detail: t('donation_saved'),
            life: 3500
        });

        resetForm();
        loadAdminDonations();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err.response?.data?.message || 'Erreur lors de l\'enregistrement.',
            life: 4000
        });
    } finally {
        saveLoading.value = false;
    }
};

// Supprimer une ligne
const deleteDonation = async (id) => {
    if (!confirm(t('delete_confirm'))) return;

    try {
        await DonationService.deleteDonation(id);
        toast.add({
            severity: 'info',
            summary: 'OK',
            detail: t('delete_success'),
            life: 3000
        });
        loadAdminDonations();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur suppression',
            life: 3000
        });
    }
};

// Réinitialiser le formulaire
const resetForm = () => {
    donationForm.nom = '';
    donationForm.prenom = '';
    donationForm.contact = '';
    donationForm.somme = null;
};

// --- MODIFICATION D'UN DON ---
const isEditDonationModalOpen = ref(false);
const editDonationLoading = ref(false);
const editDonationForm = reactive({
    _id: '',
    nom: '',
    prenom: '',
    contact: '',
    somme: null
});

const openEditDonation = (donation) => {
    editDonationForm._id = donation._id;
    editDonationForm.nom = donation.nom || '';
    editDonationForm.prenom = donation.prenom || '';
    editDonationForm.contact = donation.contact || '';
    editDonationForm.somme = donation.somme !== undefined && donation.somme !== null ? Number(donation.somme) : 0;
    isEditDonationModalOpen.value = true;
};

const closeEditDonationModal = () => {
    isEditDonationModalOpen.value = false;
};

const handleUpdateDonation = async () => {
    if (!editDonationForm.nom || !editDonationForm.contact || editDonationForm.somme === null) {
        toast.add({
            severity: 'warn',
            summary: 'Attention',
            detail: t('fill_required'),
            life: 3000
        });
        return;
    }

    editDonationLoading.value = true;
    try {
        await DonationService.updateDonation(editDonationForm._id, {
            nom: editDonationForm.nom.trim(),
            prenom: editDonationForm.prenom ? editDonationForm.prenom.trim() : '',
            contact: editDonationForm.contact.trim(),
            somme: Number(editDonationForm.somme)
        });

        toast.add({
            severity: 'success',
            summary: 'OK',
            detail: t('donation_saved') || 'Contribution modifiée avec succès !',
            life: 3500
        });

        closeEditDonationModal();
        loadAdminDonations();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: err.response?.data?.message || 'Erreur lors de la modification.',
            life: 3500
        });
    } finally {
        editDonationLoading.value = false;
    }
};

// --- MODIFICATION D'UNE REMARQUE ---
const isEditRemarqueModalOpen = ref(false);
const editRemarqueLoading = ref(false);
const editRemarqueForm = reactive({
    _id: '',
    texte_mg: '',
    texte_fr: '',
    texte_en: ''
});

const openEditRemarque = (remarque) => {
    editRemarqueForm._id = remarque._id;
    editRemarqueForm.texte_mg = remarque.texte_mg || '';
    editRemarqueForm.texte_fr = remarque.texte_fr || '';
    editRemarqueForm.texte_en = remarque.texte_en || '';
    isEditRemarqueModalOpen.value = true;
};

const closeEditRemarqueModal = () => {
    isEditRemarqueModalOpen.value = false;
};

const handleUpdateRemarque = async () => {
    if (!editRemarqueForm.texte_mg && !editRemarqueForm.texte_fr && !editRemarqueForm.texte_en) {
        toast.add({
            severity: 'warn',
            summary: 'Attention',
            detail: t('fill_required'),
            life: 3000
        });
        return;
    }

    editRemarqueLoading.value = true;
    try {
        await DonationService.updateRemarque(editRemarqueForm._id, {
            texte_mg: editRemarqueForm.texte_mg ? editRemarqueForm.texte_mg.trim() : '',
            texte_fr: editRemarqueForm.texte_fr ? editRemarqueForm.texte_fr.trim() : '',
            texte_en: editRemarqueForm.texte_en ? editRemarqueForm.texte_en.trim() : ''
        });

        toast.add({
            severity: 'success',
            summary: 'OK',
            detail: t('remarque_saved') || 'Remarque modifiée avec succès !',
            life: 3000
        });

        closeEditRemarqueModal();
        loadAdminRemarques();
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors de la modification de la remarque.',
            life: 3000
        });
    } finally {
        editRemarqueLoading.value = false;
    }
};

const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
        if (isEditDonationModalOpen.value) closeEditDonationModal();
        if (isEditRemarqueModalOpen.value) closeEditRemarqueModal();
    }
};

// Vérifier session existante au chargement
onMounted(() => {
    window.addEventListener('keydown', handleKeyDown);
    const savedToken = localStorage.getItem('collecte_auth_token');
    const savedUser = localStorage.getItem('collecte_auth_user');
    if (savedToken && savedUser) {
        try {
            currentUser.value = JSON.parse(savedUser);
            isAuthenticated.value = true;
            loadAdminDonations();
            loadAdminRemarques();
        } catch {
            localStorage.removeItem('collecte_auth_token');
        }
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.saisi-page-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 1.25rem 1.5rem 3.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }

/* ======================================================== */
/* ÉCRAN LOGIN (Style monochrome pur)                       */
/* ======================================================== */
.login-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 65vh;
}

.login-card {
    max-width: 420px;
    width: 100%;
    padding: 2.25rem 2rem;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    border: none;
}

.dark .login-card {
    background: #181818;
    box-shadow: none;
}

.login-header {
    text-align: center;
    margin-bottom: 2rem;
}

.lock-circle {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #efefef;
    color: #171717;
    font-size: 1.4rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border: none;
}

.dark .lock-circle {
    background: #242424;
    color: #ffffff;
}

.login-title {
    font-size: 1.35rem;
    font-weight: 800;
    color: #171717;
}

.dark .login-title {
    color: #ffffff;
}

.login-subtitle {
    font-size: 0.88rem;
    color: #737373;
    margin-top: 0.3rem;
}

.dark .login-subtitle {
    color: #a3a3a3;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.form-group label {
    font-size: 0.88rem;
    font-weight: 600;
    color: #444444;
}

.dark .form-group label {
    color: #cbd5e1;
}

.input-with-icon {
    position: relative;
    display: flex;
    align-items: center;
}

.input-with-icon i {
    position: absolute;
    left: 14px;
    color: #737373;
    z-index: 2;
}

.input-with-icon :deep(input) {
    padding-left: 2.6rem !important;
    border-radius: 12px;
    border: none;
    background: #efefef;
    color: #111111;
}

.dark .input-with-icon :deep(input) {
    background: #202020;
    color: #ffffff;
}

.error-banner {
    background: #efefef;
    border-left: 3px solid #171717;
    color: #171717;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.88rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dark .error-banner {
    background: #222222;
    border-left-color: #ffffff;
    color: #ffffff;
}

.submit-btn {
    background: #000000 !important;
    color: #ffffff !important;
    border: none !important;
    padding: 0.85rem !important;
    font-weight: 700 !important;
    border-radius: 12px !important;
    transition: all 0.2s ease;
}

.submit-btn:hover {
    background: #222222 !important;
}

.dark .submit-btn {
    background: #ffffff !important;
    color: #121212 !important;
}

.dark .submit-btn:hover {
    background: #e5e5e5 !important;
}

/* ======================================================== */
/* ESPACE SAISIE CONNECTÉ (Aligné sur Home)                 */
/* ======================================================== */
.admin-topbar {
    background: #efefef;
    border: none;
    border-radius: 16px;
    padding: 0.85rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
}

.dark .admin-topbar {
    background: #181818;
}

.admin-user-info {
    display: flex;
    align-items: center;
    gap: 0.85rem;
}

.user-avatar-tag {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #000000;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
}

.dark .user-avatar-tag {
    background: #282828;
    color: #ffffff;
}

.user-welcome {
    font-size: 0.95rem;
    font-weight: 700;
    color: #171717;
}

.dark .user-welcome {
    color: #ffffff;
}

.topbar-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.view-public-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.95rem;
    background: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #171717;
    transition: all 0.2s;
}

.view-public-btn:hover {
    background: #e4e4e4;
}

.dark .view-public-btn {
    background: #242424;
    color: #ffffff;
}

.dark .view-public-btn:hover {
    background: #303030;
}

.logout-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.55rem 0.95rem;
    background: #000000;
    border: none;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.2s;
}

.logout-btn:hover {
    background: #222222;
}

.dark .logout-btn {
    background: #242424;
    color: #ffffff;
}

.dark .logout-btn:hover {
    background: #303030;
}

/* Formulaire et cartes */
.form-card, .recent-table-card {
    background: #ffffff;
    border-radius: 18px;
    padding: 1.5rem 1.75rem;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

.dark .form-card,
.dark .recent-table-card {
    background: #181818;
    box-shadow: none;
}

.card-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.form-main-title, .table-title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #171717;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.dark .form-main-title,
.dark .table-title {
    color: #ffffff;
}

.form-main-subtitle, .table-subtitle {
    font-size: 0.88rem;
    color: #737373;
    margin-top: 0.2rem;
}

.dark .form-main-subtitle,
.dark .table-subtitle {
    color: #a3a3a3;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
}

.col-span-2 {
    grid-column: span 2;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
}

.required-label::after {
    content: " *";
    color: #737373;
    font-weight: 800;
}

.form-field label {
    font-size: 0.88rem;
    font-weight: 600;
    color: #444444;
}

.dark .form-field label {
    color: #cbd5e1;
}

.form-field :deep(input) {
    border-radius: 12px;
    border: none;
    background: #efefef;
    color: #111111;
    min-height: 44px;
    padding: 0.65rem 1rem;
    font-weight: 500;
}

.dark .form-field :deep(input) {
    background: #202020;
    color: #ffffff;
}

.somme-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.somme-input-container :deep(input) {
    padding-right: 3rem !important;
    font-weight: 700;
}

.somme-addon {
    position: absolute;
    right: 14px;
    font-weight: 800;
    color: #171717;
}

.dark .somme-addon {
    color: #ffffff;
}

.form-footer {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.submit-donation-btn {
    background: #000000 !important;
    color: #ffffff !important;
    border: none !important;
    padding: 0.85rem 1.6rem !important;
    font-weight: 700 !important;
    border-radius: 12px !important;
    transition: all 0.2s ease;
}

.submit-donation-btn:hover {
    background: #222222 !important;
}

.dark .submit-donation-btn {
    background: #ffffff !important;
    color: #121212 !important;
}

.dark .submit-donation-btn:hover {
    background: #e5e5e5 !important;
}

.reset-btn {
    background: transparent;
    border: none;
    color: #737373;
    padding: 0.85rem 1.25rem;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    transition: all 0.2s;
}

.reset-btn:hover {
    color: #111111;
}

.dark .reset-btn {
    color: #a3a3a3;
}

.dark .reset-btn:hover {
    color: #ffffff;
}

.actions-group {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
}

.edit-action-btn {
    background: #efefef;
    border: none;
    color: #555555;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.edit-action-btn:hover {
    background: #000000;
    color: #ffffff;
}

.dark .edit-action-btn {
    background: #242424;
    color: #cccccc;
}

.dark .edit-action-btn:hover {
    background: #ffffff;
    color: #000000;
}

.delete-action-btn {
    background: #efefef;
    border: none;
    color: #555555;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.delete-action-btn:hover {
    background: #000000;
    color: #ffffff;
}

.dark .delete-action-btn {
    background: #242424;
    color: #cccccc;
}

.dark .delete-action-btn:hover {
    background: #ffffff;
    color: #000000;
}

.refresh-table-btn {
    background: #efefef;
    border: none;
    color: #171717;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
}

.refresh-table-btn:hover {
    background: #e0e0e0;
}

.dark .refresh-table-btn {
    background: #242424;
    color: #ffffff;
}

.dark .refresh-table-btn:hover {
    background: #303030;
}

.prenom-anonyme {
    font-style: italic;
    opacity: 0.75;
}

.date-cell {
    font-size: 0.84rem;
    color: #737373;
}

.dark .date-cell {
    color: #a3a3a3;
}

.remarque-table-text {
    font-size: 0.88rem;
    color: #262626;
    line-height: 1.4;
}

.dark .remarque-table-text {
    color: #e5e5e5;
}

.table-responsive-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
}

@media (max-width: 640px) {
    .saisi-page-container {
        padding: 0.5rem 0.85rem 2.5rem;
    }
    .form-card, .recent-table-card {
        padding: 1.15rem 1rem;
        border-radius: 14px;
    }
    .admin-topbar {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.85rem;
    }
    .admin-topbar .topbar-actions {
        width: 100%;
        justify-content: space-between;
    }
    .form-grid {
        grid-template-columns: 1fr;
    }
    .col-span-2 {
        grid-column: span 1;
    }
}
</style>

<style>
/* --- MODALS DE MODIFICATION --- */
.modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.48);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    animation: fadeInModal 0.18s ease-out;
}

@keyframes fadeInModal {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-card {
    background: #ffffff;
    border-radius: 16px;
    border: 1px solid #e5e5e5;
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.18);
    width: 100%;
    max-width: 540px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: scaleInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleInModal {
    from { transform: scale(0.96); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

.dark .modal-card {
    background: #181818;
    border-color: #2e2e2e;
    box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.65);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid #efefef;
}

.dark .modal-header {
    border-color: #262626;
}

.modal-title-box {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.modal-icon-badge {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: #000000;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
}

.dark .modal-icon-badge {
    background: #ffffff;
    color: #000000;
}

.modal-title {
    font-size: 1.12rem;
    font-weight: 800;
    color: #111111;
    margin: 0;
    line-height: 1.2;
}

.dark .modal-title {
    color: #ffffff;
}

.modal-subtitle {
    font-size: 0.8rem;
    color: #737373;
    margin-top: 0.15rem;
}

.dark .modal-subtitle {
    color: #999999;
}

.modal-close-btn {
    background: transparent;
    border: none;
    color: #737373;
    font-size: 1.1rem;
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s, color 0.2s;
}

.modal-close-btn:hover {
    background: #efefef;
    color: #111111;
}

.dark .modal-close-btn:hover {
    background: #242424;
    color: #ffffff;
}

.modal-body {
    padding: 1.5rem;
    overflow-y: auto;
}

.modal-form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
}

.modal-form-grid-stacked {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.optional-hint {
    font-weight: 400;
    font-size: 0.8rem;
    color: #737373;
}

.text-uppercase-input {
    text-transform: uppercase;
}

.modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.75rem;
    padding: 1.15rem 1.5rem;
    border-top: 1px solid #efefef;
    background: #fafafa;
}

.dark .modal-footer {
    background: #141414;
    border-color: #262626;
}

.modal-cancel-btn {
    background: transparent;
    border: 1px solid #d4d4d4;
    color: #404040;
    font-size: 0.88rem;
    font-weight: 600;
    padding: 0.6rem 1.15rem;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.modal-cancel-btn:hover {
    background: #f0f0f0;
    color: #111111;
}

.dark .modal-cancel-btn {
    border-color: #3f3f46;
    color: #a1a1aa;
}

.dark .modal-cancel-btn:hover {
    background: #27272a;
    color: #ffffff;
}

.modal-submit-btn {
    background: #000000 !important;
    border: 1px solid #000000 !important;
    color: #ffffff !important;
    font-weight: 700 !important;
    padding: 0.6rem 1.35rem !important;
    border-radius: 10px !important;
    transition: all 0.2s ease !important;
}

.modal-submit-btn:hover {
    background: #222222 !important;
    border-color: #222222 !important;
}

.dark .modal-submit-btn {
    background: #ffffff !important;
    border: 1px solid #ffffff !important;
    color: #000000 !important;
}

.dark .modal-submit-btn:hover {
    background: #e5e5e5 !important;
    border-color: #e5e5e5 !important;
}
</style>
