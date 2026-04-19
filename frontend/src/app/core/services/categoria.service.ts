import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Categoria, ApiResponse, PaginatedResponse } from '../models';

export interface CategoriaFilters {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly API_URL = `${environment.apiUrl}/categorias`;

  constructor(private http: HttpClient) {}

  getAll(filters: CategoriaFilters = {}): Observable<PaginatedResponse<Categoria>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.includeInactive) params = params.set('includeInactive', 'true');

    return this.http.get<PaginatedResponse<Categoria>>(this.API_URL, { params });
  }

  getAllActive(): Observable<ApiResponse<Categoria[]>> {
    return this.http.get<ApiResponse<Categoria[]>>(`${this.API_URL}/active`);
  }

  getById(id: number): Observable<ApiResponse<Categoria>> {
    return this.http.get<ApiResponse<Categoria>>(`${this.API_URL}/${id}`);
  }

  create(categoria: Partial<Categoria>): Observable<ApiResponse<Categoria>> {
    return this.http.post<ApiResponse<Categoria>>(this.API_URL, categoria);
  }

  update(id: number, categoria: Partial<Categoria>): Observable<ApiResponse<Categoria>> {
    return this.http.put<ApiResponse<Categoria>>(`${this.API_URL}/${id}`, categoria);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
