import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import i18n from './i18n';

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import FloatLabel from 'primevue/floatlabel';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

import 'primeicons/primeicons.css';
import './assets/style.css';

const app = createApp(App);

app.use(router);
app.use(i18n);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.dark',
            cssLayer: false
        }
    }
});
app.use(ToastService);

app.component('DataTable', DataTable);
app.component('Column', Column);
app.component('InputText', InputText);
app.component('InputNumber', InputNumber);
app.component('FloatLabel', FloatLabel);
app.component('Button', Button);
app.component('Toast', Toast);

app.mount('#app');

