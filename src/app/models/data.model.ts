export interface Console {
  id: string;
  name: string;
  price: number;
  image: string;
}

export interface Game {
  id: string;
  name: string;
  price: number;
  console: string;
  image: string;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
  image: string;
  console: string;
}

export interface Client {
  id: any;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  username?: string;
  password?: string;
  addresses?: Address[];
}

export interface Rental {
  id: number;
  client: Client;
  consoleId: string;
  plan: string;
  gameIds: string[];
  accessoryIds: string[];
  purchaseOption: boolean;
  totalPrice: number;
  orderDate: string;
  // Data/hora de término do aluguel (calculada a partir do plano)
  endDate?: string;
  // Multiplicador inicial do plano (normalmente 1). Usado para migração e futuras extensões.
  planMultiplier?: number;
  // Valor pendente das extensões ainda não quitadas
  pendingExtensionAmount?: number;
  // Status do pagamento das extensões: 'pendente' | 'pago'
  pendingExtensionStatus?: 'pendente' | 'pago';
  // Confirmação do pagamento principal do aluguel
  paymentConfirmed?: boolean;
}

export interface Address {
  id?: number;
  address: string; // logradouro
  number: string;
  district: string; // bairro
  cep: string;
  city?: string;
  uf?: string;
  reference?: string;
  type: 'Casa' | 'Trabalho';
  default?: boolean;
  isDefault?: boolean; // Compatibilidade com backend
}
