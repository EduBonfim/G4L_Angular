
import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // Clona o pedido original e adiciona a propriedade 'withCredentials: true'
    // Isto diz ao Angular para enviar os cookies (como o cookie de sessão)
    const authReq = req.clone({
      withCredentials: true
    });

    // Envia o pedido modificado para o backend
    return next.handle(authReq);
  }
}
