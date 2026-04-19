import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dashboard, ApiResponse, ProductoMasVendido, VentaPorDia, Producto, MovimientoStock } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly API_URL = `${environment.apiUrl}/reportes`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<Dashboard>> {
    return this.http.get<ApiResponse<Dashboard>>(`${this.API_URL}/dashboard`);
  }

  getVentasPorDia(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<VentaPorDia[]>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<VentaPorDia[]>>(`${this.API_URL}/ventas-diarias`, { params });
  }

  getProductosMasVendidos(limit: number = 10, fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<ProductoMasVendido[]>> {
    let params = new HttpParams().set('limit', limit.toString());
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<ProductoMasVendido[]>>(`${this.API_URL}/productos-mas-vendidos`, { params });
  }

  getProductosBajoStock(threshold?: number): Observable<ApiResponse<Producto[]>> {
    let params = new HttpParams();
    if (threshold) params = params.set('threshold', threshold.toString());

    return this.http.get<ApiResponse<Producto[]>>(`${this.API_URL}/bajo-stock`, { params });
  }

  getMovimientosStock(fechaInicio?: string, fechaFin?: string): Observable<ApiResponse<MovimientoStock[]>> {
    let params = new HttpParams();
    if (fechaInicio) params = params.set('fecha_inicio', fechaInicio);
    if (fechaFin) params = params.set('fecha_fin', fechaFin);

    return this.http.get<ApiResponse<MovimientoStock[]>>(`${this.API_URL}/movimientos-stock`, { params });
  }
}
