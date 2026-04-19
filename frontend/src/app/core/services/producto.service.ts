import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Producto, ApiResponse, PaginatedResponse, MovimientoStock } from '../models';

export interface ProductoFilters {
  page?: number;
  limit?: number;
  categoria_id?: number;
  search?: string;
  includeInactive?: boolean;
}

export interface UpdateStockRequest {
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  motivo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly API_URL = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  getAll(filters: ProductoFilters = {}): Observable<PaginatedResponse<Producto>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.categoria_id) params = params.set('categoria_id', filters.categoria_id.toString());
    if (filters.search) params = params.set('search', filters.search);
    if (filters.includeInactive) params = params.set('includeInactive', 'true');

    return this.http.get<PaginatedResponse<Producto>>(this.API_URL, { params });
  }

  getById(id: number): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.API_URL}/${id}`);
  }

  getByBarcode(codigo: string): Observable<ApiResponse<Producto>> {
    return this.http.get<ApiResponse<Producto>>(`${this.API_URL}/barcode/${codigo}`);
  }

  create(producto: Partial<Producto>): Observable<ApiResponse<Producto>> {
    return this.http.post<ApiResponse<Producto>>(this.API_URL, producto);
  }

  update(id: number, producto: Partial<Producto>): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.API_URL}/${id}`, producto);
  }

  delete(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  updateStock(id: number, data: UpdateStockRequest): Observable<ApiResponse<Producto>> {
    return this.http.put<ApiResponse<Producto>>(`${this.API_URL}/${id}/stock`, data);
  }

  getStockHistory(id: number): Observable<ApiResponse<MovimientoStock[]>> {
    return this.http.get<ApiResponse<MovimientoStock[]>>(`${this.API_URL}/${id}/stock-history`);
  }
}
