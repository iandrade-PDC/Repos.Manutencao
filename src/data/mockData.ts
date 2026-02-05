export type Order = {
  id: string;
  title: string;
  requester: string;
  date: string;
  location: string;
  sector: string;
  priority: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberto' | 'em_andamento' | 'concluido';
};

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', title: 'Lâmpada queimada', requester: 'Maria Silva', date: '2024-01-28', location: 'Recepção', sector: 'Hall de Entrada', priority: 'baixa', status: 'concluido' },
  { id: 'ORD-002', title: 'Vazamento na pia', requester: 'João Santos', date: '2024-01-29', location: 'Casa Verde', sector: 'Cozinha', priority: 'alta', status: 'em_andamento' },
  { id: 'ORD-003', title: 'Ar condicionado pifou', requester: 'Ana Oliveira', date: '2024-01-30', location: 'Casa Verde', sector: 'Suíte 1', priority: 'urgente', status: 'aberto' },
  { id: 'ORD-004', title: 'Porta rangendo', requester: 'Pedro Souza', date: '2024-01-30', location: 'Salão de Festas', sector: 'Salão Principal', priority: 'baixa', status: 'aberto' },
  { id: 'ORD-005', title: 'Limpeza da piscina', requester: 'Carlos Lima', date: '2024-01-25', location: 'Área da Piscina', sector: 'Deck', priority: 'media', status: 'concluido' },
  { id: 'ORD-006', title: 'Tomada sem energia', requester: 'Maria Silva', date: '2024-01-29', location: 'Recepção', sector: 'Balcão', priority: 'media', status: 'aberto' },
  { id: 'ORD-007', title: 'Chuveiro queimado', requester: 'Lucas Mendes', date: '2024-01-31', location: 'Casa Verde', sector: 'Banheiro Social', priority: 'alta', status: 'aberto' },
];
