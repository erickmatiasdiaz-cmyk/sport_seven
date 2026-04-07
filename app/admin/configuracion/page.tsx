'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import { useAuth } from '@/contexts/AuthContext';

interface Court {
  id: string;
  name: string;
  image: string;
  isActive: boolean;
  price60: number;
  price90: number;
  openingTime: string;
  closingTime: string;
  allows60: boolean;
  allows90: boolean;
  createdAt: string;
}

function CourtConfigPage() {
  const { user } = useAuth();
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    image: '',
    price60: 20000,
    price90: 30000,
    openingTime: '18:00',
    closingTime: '23:00',
    allows60: true,
    allows90: false,
    isActive: true,
  });

  const adminHeaders = useMemo(
    () => (user?.role === 'admin' ? { 'x-user-role': user.role } : undefined),
    [user?.role]
  );

  const fetchCourts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courts?includeInactive=true', {
        headers: adminHeaders,
      });
      const data = await res.json();
      setCourts(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      price60: 20000,
      price90: 30000,
      openingTime: '18:00',
      closingTime: '23:00',
      allows60: true,
      allows90: false,
      isActive: true,
    });
    setEditingCourt(null);
    setShowForm(false);
  };

  const handleEdit = (court: Court) => {
    setEditingCourt(court);
    setFormData({
      name: court.name,
      image: court.image,
      price60: court.price60,
      price90: court.price90,
      openingTime: court.openingTime,
      closingTime: court.closingTime,
      allows60: court.allows60,
      allows90: court.allows90,
      isActive: court.isActive,
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingCourt ? '/api/courts' : '/api/courts';
      const method = editingCourt ? 'PUT' : 'POST';

      const body: any = { ...formData };
      if (editingCourt) {
        body.id = editingCourt.id;
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(adminHeaders ?? {}),
        },
        body: JSON.stringify({ ...body, userRole: user?.role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error');
      }

      alert(editingCourt ? 'Cancha actualizada exitosamente' : 'Cancha creada exitosamente');
      resetForm();
      fetchCourts();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (court: Court) => {
    try {
      const res = await fetch('/api/courts', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(adminHeaders ?? {}),
        },
        body: JSON.stringify({ id: court.id, isActive: !court.isActive, userRole: user?.role }),
      });

      if (!res.ok) throw new Error('Error');
      fetchCourts();
    } catch (error) {
      alert('Error al actualizar la cancha');
    }
  };

  const handleDelete = async (courtId: string) => {
    if (!confirm('¿Eliminar esta cancha? Esta acción no se puede deshacer.')) return;

    try {
      const res = await fetch(`/api/courts?id=${courtId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });

      if (!res.ok) throw new Error('Error');
      fetchCourts();
      alert('Cancha eliminada');
    } catch (error) {
      alert('Error al eliminar la cancha');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <main className="page-content">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#1FA3C8] to-[#1889A8] text-white shadow-lg">
        <div className="header-container px-4 py-4 pb-6 rounded-b-3xl">
          <Link href="/admin" className="inline-flex items-center mb-3 text-white/80 hover:text-white">
            <svg className="w-5 h-5 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="truncate">Volver al Admin</span>
          </Link>
          <h1 className="text-xl font-bold text-white truncate">Configuración de Canchas</h1>
          <p className="text-white/80 text-sm mt-1">Gestiona las canchas del complejo</p>
        </div>
      </header>

      <div className="px-4 -mt-3 space-y-4">
        {/* Add Court Button */}
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="w-full bg-[#F7931E] hover:bg-[#E07D0A] text-white font-semibold py-3.5 px-4 rounded-2xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar Cancha
        </button>

        {/* Court Form Modal */}
        {showForm && (
          <section className="bg-white rounded-3xl p-5 shadow-md">
            <h2 className="text-lg font-bold text-text-dark mb-4">
              {editingCourt ? 'Editar Cancha' : 'Nueva Cancha'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-1.5">
                  Nombre de la cancha
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                  placeholder="Ej: Cancha Fútbol 3"
                  required
                />
              </div>

              {/* Price 60 and 90 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Precio 60 min
                  </label>
                  <input
                    type="number"
                    value={formData.price60}
                    onChange={(e) => setFormData({ ...formData, price60: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Precio 90 min
                  </label>
                  <input
                    type="number"
                    value={formData.price90}
                    onChange={(e) => setFormData({ ...formData, price90: parseInt(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              {/* Opening and Closing Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Hora apertura
                  </label>
                  <input
                    type="time"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1.5">
                    Hora cierre
                  </label>
                  <input
                    type="time"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              {/* Duration Options */}
              <div>
                <label className="block text-sm font-medium text-text-dark mb-2">
                  Duraciones permitidas
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allows60}
                      onChange={(e) => setFormData({ ...formData, allows60: e.target.checked })}
                      className="w-5 h-5 text-[#F7931E] rounded focus:ring-[#F7931E]"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-dark">60 minutos</p>
                      <p className="text-xs text-text-light">{formatPrice(formData.price60)}</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allows90}
                      onChange={(e) => setFormData({ ...formData, allows90: e.target.checked })}
                      className="w-5 h-5 text-[#F7931E] rounded focus:ring-[#F7931E]"
                    />
                    <div>
                      <p className="text-sm font-medium text-text-dark">90 minutos</p>
                      <p className="text-xs text-text-light">{formatPrice(formData.price90)}</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-[#22c55e] rounded focus:ring-[#22c55e]"
                />
                <div>
                  <p className="text-sm font-medium text-text-dark">Cancha activa</p>
                  <p className="text-xs text-text-light">
                    {formData.isActive ? 'Visible para usuarios' : 'Oculta para usuarios'}
                  </p>
                </div>
              </label>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-text-dark font-semibold py-3.5 px-4 rounded-2xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#F7931E] hover:bg-[#E07D0A] disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Courts List */}
        <section>
          <h2 className="text-lg font-bold text-text-dark mb-3">
            Canchas ({courts.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1FA3C8]"></div>
            </div>
          ) : courts.length === 0 ? (
            <div className="bg-white rounded-3xl p-6 text-center shadow-sm">
              <p className="text-gray-500 text-sm">No hay canchas configuradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {courts.map((court) => (
                <div key={court.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-text-dark">{court.name}</h3>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            court.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {court.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-light">
                        <span>
                          {court.openingTime} - {court.closingTime}
                        </span>
                        <span>•</span>
                        <span>
                          {court.allows60 && '60min'}
                          {court.allows60 && court.allows90 && ' / '}
                          {court.allows90 && '90min'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-2 text-xs">
                      <span className="bg-blue-50 text-[#1FA3C8] px-2 py-1 rounded-lg font-medium">
                        60min: {formatPrice(court.price60)}
                      </span>
                      {court.allows90 && (
                        <span className="bg-orange-50 text-[#F7931E] px-2 py-1 rounded-lg font-medium">
                          90min: {formatPrice(court.price90)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(court)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                          court.isActive
                            ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                            : 'bg-green-50 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        {court.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => handleEdit(court)}
                        className="text-xs font-medium bg-blue-50 text-[#1FA3C8] px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(court.id)}
                        className="text-xs font-medium bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function CourtConfigPageWrapper() {
  return (
    <AuthGuard requireAuth={true} requireAdmin={true}>
      <CourtConfigPage />
    </AuthGuard>
  );
}

export { CourtConfigPageWrapper as default };
