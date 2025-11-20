import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http'; // ⬅️ 1. IMPORTE O HTTPCLIENT E O INTERCEPTOR
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // ⬅️ Importe os módulos de formulário

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AuthInterceptor } from './services/auth.interceptor'; 

// Importe todos os seus componentes
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { AdminComponent } from './components/admin/admin.component';
import { UserAreaComponent } from './components/user-area/user-area.component';
import { RentComponent } from './components/rent/rent.component';
import { GamesComponent } from './components/games/games.component';
import { AccessoriesComponent } from './components/accessories/accessories.component';
// ... (Adicione outros componentes se houver)

@NgModule({
  declarations: [
    // 3. Adicione todos os seus componentes aqui
    AppComponent,
    HomeComponent,
    LoginComponent,
    AdminComponent,
    UserAreaComponent,
    RentComponent,
    GamesComponent,
    AccessoriesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule, // ⬅️ 4. ADICIONE O HttpClientModule
    FormsModule,          // ⬅️ Adicione para o (ngModel)
    ReactiveFormsModule   // ⬅️ Adicione para o [formGroup]
  ],
  providers: [
    // ⬇️ 5. ADICIONE ESTE BLOCO 'providers' PARA REGISTAR O INTERCETOR ⬇️
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }