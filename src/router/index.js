import { createRouter, createWebHistory } from 'vue-router';
import PublicTable from '../views/PublicTable.vue';
import NenyMampiditraSaisi from '../views/NenyMampiditraSaisi.vue';

const routes = [
    {
        path: '/',
        name: 'PublicTable',
        component: PublicTable,
        meta: { title: 'Tableau des Contributions - Collecte Ambohimalaza' }
    },
    {
        path: '/neny-mampiditra-saisi',
        name: 'NenyMampiditraSaisi',
        component: NenyMampiditraSaisi,
        meta: { title: 'Saisie des dons - Ambohimalaza' }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to, from, next) => {
    if (to.meta && to.meta.title) {
        document.title = to.meta.title;
    }
    next();
});

export default router;

