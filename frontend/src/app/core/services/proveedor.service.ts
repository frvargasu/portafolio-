import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Proveedor, ApiResponse, PaginatedResponse } from '../models';

export interface ProveedorFilters {
  page?: number;
  limit?: number;
  includeInactive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private readonly API_URL = `${environment.apiUrl}/proveedores`;

  constructor(private http: HttpClient) {}

  getAll(filters: ProveedorFilters = {}): Observable<PaginatedResponse<Proveedor>> {
    let params = new HttpParams();

    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.includeInactive) params = params.set('includeInactive', 'true');

    return this.http.get<PaginatedResponse<Proveedor>>(this.API_URL, { params });
  }

  getById(id: number): Observable<ApiResponse<Proveedor>> {
    return this.http.get<ApiResponse<Proveedor>>(`${this.API_URL}/${id}`);
  }

  create(proveedor: Partial<Proveedor>): Observable<ApiResponse<Proveedor>> {
    return this.http.post<ApiResponse<Proveedor>>(this.API_URL, proveedor);
  }

  update(id: number, proveedor: Partial<Proveedor>): Observable<ApiResponse<Proveedor>> {
    return this.http.put<ApiResponse<Proveedor>>(`${this.API_URL}/${id}`, proveedor);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}
