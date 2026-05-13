import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'tasks',
  },
  {
    path: 'tasks',
    loadComponent: () => import('./features/task-list/task-list.page'),
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./features/task-create/task-create.page'),
  },
  {
    path: 'states',
    loadComponent: () => import('./features/task-states/task-states.page'),
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./features/task-detail/task-detail.page'),
  },
  {
    path: '**',
    redirectTo: 'tasks',
  },
];
