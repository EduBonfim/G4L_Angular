import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessoriesComponent } from './components/accessories/accessories.component';
import { AdminComponent } from './components/admin/admin.component';
import { UserAreaComponent } from './components/user-area/user-area.component';
import { GamesComponent } from './components/games/games.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RentComponent } from './components/rent/rent.component';
import { authGuard } from './guards/auth.guard'; // 1. Importe o guarda

const routes: Routes = [
  // --- Rotas Públicas ---
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // --- Rotas Públicas (Sem necessidade de login) ---
  { 
    path: 'accessories', 
    component: AccessoriesComponent
  },
  { 
    path: 'games', 
    component: GamesComponent
  },
  { 
    path: 'rent', 
    component: RentComponent
    // Removido authGuard - verificação de login é feita no componente ao finalizar
  },
  
  // --- Rotas Protegidas (Exigem Login) ---
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [authGuard] // Protegido
  },
  { 
    path: 'user-area', 
    component: UserAreaComponent, 
    canActivate: [authGuard] // Protegido
  },
  
  { path: '**', redirectTo: '/home' } // Rota coringa
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'top',
    anchorScrolling: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }