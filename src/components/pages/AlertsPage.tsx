'use client'

import { useState, useEffect } from 'react';

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Carregar avisos (será integrado com Supabase)
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    // TODO: Implementar carregamento de avisos do Supabase
    // Por enquanto, usar dados mocados para demonstração
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'danger',
        title: 'Equipamento Offline',
        message: 'Aspirador ID #5 está offline há mais de 2 horas. Verifique a conexão.',
        created_at: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'warning',
        title: 'Manutenção Necessária',
        message: 'Equipamento ID #3 necessita limpeza. Última limpeza foi há 30 dias.',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        read: false
      },
      {
        id: '3',
        type: 'info',
        title: 'Novo Crédito Adicionado',
        message: 'Cliente João Silva recebeu R$ 100.00 em crédito.',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        read: true
      },
    ];
    setAlerts(mockAlerts);
  };

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, read: true } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id));
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-50 border-l-4 border-red-500';
      case 'warning':
        return 'bg-yellow-50 border-l-4 border-yellow-500';
      case 'success':
        return 'bg-green-50 border-l-4 border-green-500';
      case 'info':
      default:
        return 'bg-blue-50 border-l-4 border-blue-500';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'success':
        return '✓';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Avisos do Sistema</h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                  {unreadCount} novo{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">Nenhum aviso no momento</p>
            <p className="text-gray-400 text-sm mt-2">Você está tudo certo! 🎉</p>
          </div>
        ) : (
          alerts.map((alert: Alert) => (
            <div
              key={alert.id}
              className={`rounded-lg shadow p-4 ${getAlertColor(alert.type)} ${!alert.read ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <span className="text-2xl">{getAlertIcon(alert.type)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {alert.title}
                      {!alert.read && <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">NOVO</span>}
                    </h3>
                    <p className="text-gray-700 mt-1">{alert.message}</p>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(alert.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!alert.read && (
                    <button
                      onClick={() => markAsRead(alert.id)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Marcar lido
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="px-3 py-1 text-sm bg-gray-300 text-gray-900 rounded hover:bg-gray-400 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Tipos de Avisos</h3>
        <ul className="space-y-2 text-blue-800 text-sm">
          <li><span className="font-bold">⚠️ Avisos Críticos:</span> Equipamentos offline, problemas de conectividade</li>
          <li><span className="font-bold">⚡ Atenção:</span> Manutenção necessária, última limpeza há muito tempo</li>
          <li><span className="font-bold">ℹ️ Informativo:</span> Novos créditos, atualizações do sistema</li>
          <li><span className="font-bold">✓ Sucesso:</span> Operações concluídas com sucesso</li>
        </ul>
      </div>
    </div>
  );
}
