// This file allows for easy expansion of locations and sectors.
// Format: "Location Name": ["Sector 1", "Sector 2", ...]

export const LOCATION_DATA: Record<string, string[]> = {
  'Tesoura': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Coqueiro': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Cajueiro': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Igreja': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Maria Praça': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Maria Rio': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Cobogó': ['Sala', 'Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiros', 'Extras', 'Áreas externas'],
  'Área Ancoradouro': [
    'Spa Pitanguinha', 'Anexo Pitanguinha', 'Sala de mapas', 'Lounge', 'Banheiro Nazaré', 
    'Armazém', 'Restaurante VI', 'Bar VI', 'Cozinha', 'Banheiro Spa', 'Quiosques VI', 
    'Jardim', 'Callworking', 'Bar do Rio', 'Extras'
  ],
  'Áreas Comum': [
    'Brinquedos', 'Piscina', 'Bar da Piscina', 'Marinheiro', 'Quiosque da Piscina', 
    'Academia', 'Estacionamento', 'Garagem Náutica', 'Quadra de Tênis'
  ],
  'Áreas de Serviço': [
    'Almoxarifado Cozinha', 'Escritório ADM', 'Lavanderia', 'Refeitório', 'Cozinha de Produção', 
    'Vestiário', 'Marcenaria', 'Casa de bombas', 'Extras', 'Almoxarifado Manutenção', 
    'Depósito Nucleo & ADM', 'Gerador', 'Casa de Gás', 'Casa do Gerador'
  ],
  'Alameda': [
    'Quiosque', 'Guarderia', 'Guarderia Copa', 'Guarderia Banheiro', 'Guarderia Estoque', 
    'Bar da Praia', 'Chuveiro Praia', 'Extras'
  ],
  'Hospedaria': ['Sala e Cozinha', 'Suíte 1', 'Suíte 2', 'Suíte 3', 'Banheiro', 'Extras', 'Áreas externas'],
  'Área Casa Verde': [
    'Escritório', 'Ateliê', 'Entreposto', 'Estação de Água', 'Área do Gerador', 'Portaria', 'Extras'
  ],
  'Manutenção': [
    'Gerador 1 (Ancoradouro)', 'Gerador 2 (Hospedaria)', 'Carrinho elétrico (Experiências)', 
    'Carrinho elétrico (Alugado)', 'Carrinho elétrico (Geral)', 'Triciclo Elétrico (Restaurante)', 
    'Triciclo Elétrico (Jardim)', 'Triciclo Elétrico (Operação)', 'Outras'
  ],
  'Ponta Grossa': ['Casa 1 (Hospedes)', 'Casa 2 (Caseiro)'],
  'Container': ['Interno', 'Externo']
};

export const PRIORITIES = [
  { value: 'baixa', label: 'Baixa', color: 'bg-green-100 text-green-800' },
  { value: 'media', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'alta', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgente', label: 'Urgente', color: 'bg-red-100 text-red-800' },
];
