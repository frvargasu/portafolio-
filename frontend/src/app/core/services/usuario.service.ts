import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario, ApiResponse, PaginatedResponse } from '../models';

export interface CreateUsuarioRequest {
  nombre: string;
  email: string;
  password: string;
  rol?: 'admin' | 'vendedor';
}

export interface UpdateUsuarioRequest {
  nombre?: string;
  email?: string;
  rol?: 'admin' | 'vendedor';
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PaginatedResponse<Usuario>> {
    return this.http.get<PaginatedResponse<Usuario>>(this.API_URL);
  }

  create(data: CreateUsuarioRequest): Observable<ApiResponse<Usuario>> {
    return this.http.post<ApiResponse<Usuario>>(this.API_URL, data);
  }

  update(id: number, data: UpdateUsuarioRequest): Observable<ApiResponse<Usuario>> {
    return this.http.put<ApiResponse<Usuario>>(`${this.API_URL}/${id}`, data);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  changePassword(passwordActual: string, passwordNueva: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API_URL}/cambiar-password`, { passwordActual, passwordNueva });
  }
}
