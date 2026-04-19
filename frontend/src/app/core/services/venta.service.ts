import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Venta, CreateVentaRequest, ApiResponse, PaginatedResponse } from '../models';

export interface VentaFilters {
  page?: number;
  limit?: number;
  usuario_id?: number;
  estado?: 'completada' | 'cancelada';
  fecha_inicio?: string;
  fecha_fin?: string;
}

export interface VentaStats {
  total_ventas: number;
  cantidad_ventas: number;
  promedio_venta: number;
  metodos_pago: { metodo: string; cantidad: number; total: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private readonly API_URL = `${environment.apiUrl}/ventas`;

  constructor(private http: HttpClient) {}

  getAll(filters: VentaFilters = {}): Observable<PaginatedResponse<Venta>> {
    let params = new HttpParams();
    
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());
    if (filters.usuario_id) params = params.set('usuario_id', filters.usuario_id.toString());
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.fecha_inicio) params = params.set('fecha_inicio', filters.fecha_inicio);
    if (filters.fecha_fin) params = params.set('fecha_fin', filters.fecha_fin);

    return this.http.get<PaginatedResponse<Venta>>(this.API_URL, { params });
  }

  getTodaySales(): Observable<ApiResponse<Venta[]>> {
    return this.http.get<ApiResponse<Venta[]>>(`${this.API_URL}/today`);
  }

  getById(id: number): Observable<ApiResponse<Venta>> {
    return this.http.get<ApiResponse<Venta>>(`${this.API_URL}/${id}`);
  }

  create(venta: CreateVentaRequest): Observable<ApiResponse<Venta>> {
    return this.http.post<ApiResponse<Venta>>(this.API_URL, venta);
  }

  cancel(id: number, motivo?: string): Observable<ApiResponse<Venta>> {
    return this.http.put<ApiResponse<Venta>>(`${this.API_URL}/${id}/cancel`, { motivo });
  }

  getStats(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<VentaStats>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<VentaStats>>(`${this.API_URL}/stats`, { params });
  }
}
