// ARQUIVO COMPLETO E CORRIGIDO: src/main.ts

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module'; // Importa o seu AppModule

// Esta função inicializa a aplicação usando o AppModule,
// que é o método correto para a sua estrutura de projeto.
platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));