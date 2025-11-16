'use client';

import { useMachine } from '@/contexts/MachineContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SlugPage() {
  const { machine, loading, error } = useMachine();
  const { user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Carregando máquina...</p>
        </div>
      </div>
    );
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4">
        <div className="text-center">
          <h1 className="text-white text-3xl font-bold mb-4">❌ Máquina não encontrada</h1>
          <p className="text-gray-400 mb-8">{error || 'A máquina especificada não existe'}</p>
          <a
            href="/"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Voltar
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Informação da máquina no topo */}
      <div className="bg-gray-900 border-b border-gray-800 py-6 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{machine.location}</h1>
          <div className="flex items-center gap-4 text-sm">
            <p className="text-gray-400">
              <span className="text-gray-500">ID:</span> <code className="bg-gray-800 px-2 py-1 rounded">{machine.id}</code>
            </p>
            <p className="text-gray-400">
              <span className="text-gray-500">Slug:</span> <code className="bg-gray-800 px-2 py-1 rounded">{machine.slug_id}</code>
            </p>
            <p className="text-gray-400">
              <span className="text-gray-500">Status:</span>
              <span className={`ml-2 ${machine.status === 'online' ? 'text-green-500' : 'text-gray-500'}`}>
                {machine.status === 'online' ? '✅ Online' : '⚪ Offline'}
              </span>
            </p>
            <p className="text-gray-400">
              <span className="text-gray-500">Comando:</span>
              <span className={`ml-2 ${machine.command === 'on' ? 'text-green-500' : 'text-gray-500'}`}>
                {machine.command === 'on' ? '🟢 Ligada' : '⚫ Desligada'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Bem-vindo ao UpCarAspiradores!</h2>
          <p className="text-gray-400 mb-6">
            Você está conectado à máquina <span className="text-orange-500 font-bold">{machine.location}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card de Ativar Máquina */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-orange-500 transition">
            <h3 className="text-xl font-bold mb-4">🔌 Ativar Máquina</h3>
            <p className="text-gray-400 mb-4">
              Clique no botão abaixo para ativar a máquina de aspiração.
            </p>
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded-lg transition">
              Ativar Agora
            </button>
          </div>

          {/* Card de Ver Histórico */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500 transition">
            <h3 className="text-xl font-bold mb-4">📊 Histórico de Uso</h3>
            <p className="text-gray-400 mb-4">
              Veja o histórico de uso desta máquina.
            </p>
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition">
              Ver Histórico
            </button>
          </div>

          {/* Card de Comprar Crédito */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-green-500 transition">
            <h3 className="text-xl font-bold mb-4">💰 Comprar Crédito</h3>
            <p className="text-gray-400 mb-4">
              Adquira créditos para usar a máquina.
            </p>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition">
              Comprar Crédito
            </button>
          </div>

          {/* Card de Suporte */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-500 transition">
            <h3 className="text-xl font-bold mb-4">📞 Suporte</h3>
            <p className="text-gray-400 mb-4">
              Precisa de ajuda? Entre em contato com o suporte.
            </p>
            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition">
              Contatar Suporte
            </button>
          </div>
        </div>

        {/* Informações Técnicas */}
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4">ℹ️ Informações Técnicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p><span className="text-gray-500">ID da Máquina:</span> {machine.id}</p>
              <p className="mt-2"><span className="text-gray-500">Localização:</span> {machine.location}</p>
              <p className="mt-2"><span className="text-gray-500">Slug:</span> {machine.slug_id}</p>
            </div>
            <div>
              <p><span className="text-gray-500">Status:</span> {machine.status}</p>
              <p className="mt-2"><span className="text-gray-500">Comando:</span> {machine.command}</p>
              <p className="mt-2"><span className="text-gray-500">Criado em:</span> {machine.created_at ? new Date(machine.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
