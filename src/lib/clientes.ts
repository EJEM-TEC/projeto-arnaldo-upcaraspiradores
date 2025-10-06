export interface Cliente {
  id: number;
  name: string;
}

export const obterListaDeClientes = (): Cliente[] => {
  // Retorna um array de objetos que seguem a estrutura da interface Cliente
  return [
    { id: 1, name: "João Silva" },
    { id: 2, name: "Maria Santos" },
    { id: 3, name: "Pedro Costa" },
    { id: 4, name: "Ana Pereira" },
  ];
};

export const obterClientePorId = (id: number): Cliente | undefined => {
  const clientes = obterListaDeClientes();
  return clientes.find(cliente => cliente.id === id);
};
