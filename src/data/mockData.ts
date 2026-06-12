export type ReportStatus = 'pre_publicacao' | 'aguardando_validacao' | 'em_analise' | 'em_execucao' | 'resolvido' | 'resolucao_validada' | 'resolucao_rejeitada' | 'arquivado';
export type OrganType = 'prefeitura' | 'agua_saneamento' | 'energia_luz';
export type Priority = 'baixa' | 'media' | 'alta' | 'critica';

export interface Municipality {
  id: string;
  name: string;
  state: string;
  center: [number, number];
  zoom: number;
}

export interface Neighborhood {
  id: string;
  backendId?: number;
  name: string;
  municipalityId: string;
  populationEstimate?: number | null;
}

export interface Category {
  id: string;
  backendId?: number;
  slug?: string;
  name: string;
  description?: string | null;
  color?: string | null;
  organ?: OrganType;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  backendId?: number;
  slug?: string;
  name: string;
  categoryId: string;
  description?: string | null;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  categoryName?: string;
  subcategoryName?: string;
  status: ReportStatus;
  priority: Priority;
  lat: number;
  lng: number;
  neighborhood: string;
  neighborhoodId?: string;
  municipalityId: string;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  validations: number;
  requiredValidations: number;
  resolutionValidations: number;
  organ: OrganType;
  organizationId?: string;
  organizationName?: string;
  authorId?: string;
  upvoteCount?: number;
  downvoteCount?: number;
  score?: number;
  imageUrl: string;
  imageUrls?: string[];
  estimatedCompletion?: string;
  statusHistory: StatusHistoryEntry[];
  rejectionReason?: string;
  isRecurrence?: boolean;
  previousReportId?: string;
  recurrenceCount?: number;
}

export interface StatusHistoryEntry {
  status: ReportStatus;
  date: string;
  note?: string;
  by?: string;
  reason?: string;
}

export interface ValidationRequest {
  id: string;
  reportId: string;
  reportTitle: string;
  reportImageUrl: string;
  type: 'existence' | 'resolution';
  deadline: string;
  neighborhood: string;
  lat: number;
  lng: number;
}

export const DUPLICATE_RADIUS_METERS = 7;
export const NEARBY_RADIUS_METERS = 500;

export const rejectionReasons = [
  { id: 'duplicada', label: 'Ocorrência duplicada' },
  { id: 'localizacao_incorreta', label: 'Localização incorreta' },
  { id: 'imagem_insuficiente', label: 'Imagem insuficiente' },
  { id: 'categoria_incorreta', label: 'Categoria incorreta' },
  { id: 'nao_confirmada', label: 'Não foi possível confirmar existência' },
  { id: 'ja_resolvido', label: 'Problema já resolvido' },
  { id: 'conteudo_inadequado', label: 'Conteúdo inadequado' },
];

export const priorityLabels: Record<Priority, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

export const priorityColors: Record<Priority, string> = {
  baixa: 'hsl(210, 14%, 70%)',
  media: 'hsl(45, 100%, 51%)',
  alta: 'hsl(25, 95%, 53%)',
  critica: 'hsl(0, 84%, 60%)',
};

export const currentMunicipality: Municipality = {
  id: 'videira-sc',
  name: 'Videira',
  state: 'SC',
  center: [-27.0078, -51.1519],
  zoom: 14,
};

export const neighborhoods: Neighborhood[] = [
  { id: 'centro', name: 'Centro', municipalityId: 'videira-sc' },
  { id: 'alvorada', name: 'Alvorada', municipalityId: 'videira-sc' },
  { id: 'matriz', name: 'Matriz', municipalityId: 'videira-sc' },
  { id: 'farroupilha', name: 'Farroupilha', municipalityId: 'videira-sc' },
  { id: 'santo-antonio', name: 'Santo Antônio', municipalityId: 'videira-sc' },
  { id: 'sao-cristovao', name: 'São Cristóvão', municipalityId: 'videira-sc' },
  { id: 'bom-retiro', name: 'Bom Retiro', municipalityId: 'videira-sc' },
  { id: 'san-remo', name: 'San Remo', municipalityId: 'videira-sc' },
  { id: 'presidente-medici', name: 'Presidente Médici', municipalityId: 'videira-sc' },
  { id: 'maro', name: 'Maro', municipalityId: 'videira-sc' },
  { id: 'rio-das-pedras', name: 'Rio das Pedras', municipalityId: 'videira-sc' },
  { id: 'industrial', name: 'Industrial', municipalityId: 'videira-sc' },
  { id: 'grapia', name: 'Grápia', municipalityId: 'videira-sc' },
  { id: 'panorama', name: 'Panorama', municipalityId: 'videira-sc' },
  { id: 'nossa-senhora-das-gracas', name: 'N. S. das Graças', municipalityId: 'videira-sc' },
];

export const neighborhoodNames = neighborhoods.map(n => n.name);

export const categories: Category[] = [
  {
    id: 'infra', name: 'Infraestrutura Urbana', organ: 'prefeitura',
    subcategories: [
      { id: 'buraco', name: 'Buraco', categoryId: 'infra' },
      { id: 'grade_quebrada', name: 'Grade Quebrada', categoryId: 'infra' },
      { id: 'lixeira_destruida', name: 'Lixeira Destruída', categoryId: 'infra' },
      { id: 'lixeira_entupida', name: 'Lixeira Entupida', categoryId: 'infra' },
      { id: 'bueiro_entupido', name: 'Bueiro Entupido', categoryId: 'infra' },
    ],
  },
  {
    id: 'estrutural', name: 'Problemas Estruturais', organ: 'prefeitura',
    subcategories: [
      { id: 'erosao', name: 'Erosão', categoryId: 'estrutural' },
      { id: 'dano_estrutural', name: 'Dano Estrutural Grave', categoryId: 'estrutural' },
      { id: 'longa_execucao', name: 'Problema de Longa Execução', categoryId: 'estrutural' },
    ],
  },
  {
    id: 'iluminacao', name: 'Iluminação Pública', organ: 'prefeitura',
    subcategories: [
      { id: 'poste_apagado', name: 'Poste Apagado', categoryId: 'iluminacao' },
      { id: 'poste_piscando', name: 'Poste Piscando', categoryId: 'iluminacao' },
      { id: 'falha_iluminacao', name: 'Falha de Iluminação', categoryId: 'iluminacao' },
    ],
  },
  {
    id: 'servico', name: 'Serviço Público', organ: 'prefeitura',
    subcategories: [
      { id: 'falha_manutencao', name: 'Falha de Manutenção', categoryId: 'servico' },
      { id: 'coleta_irregular', name: 'Coleta Irregular', categoryId: 'servico' },
      { id: 'problema_operacional', name: 'Problema Operacional', categoryId: 'servico' },
    ],
  },
  {
    id: 'agua', name: 'Água e Saneamento (VISAN)', organ: 'agua_saneamento',
    subcategories: [
      { id: 'vazamento', name: 'Vazamento', categoryId: 'agua' },
      { id: 'falta_agua', name: 'Falta de Água', categoryId: 'agua' },
      { id: 'esgoto', name: 'Esgoto', categoryId: 'agua' },
      { id: 'tampa_quebrada', name: 'Tampa Quebrada', categoryId: 'agua' },
    ],
  },
  {
    id: 'energia', name: 'Energia e Iluminação (CELESC)', organ: 'energia_luz',
    subcategories: [
      { id: 'falta_energia', name: 'Falta de Energia Pontual', categoryId: 'energia' },
      { id: 'poste_risco', name: 'Poste com Risco', categoryId: 'energia' },
      { id: 'fiacao_exposta', name: 'Fiação Exposta', categoryId: 'energia' },
      { id: 'problema_eletrico', name: 'Problema Elétrico Visível', categoryId: 'energia' },
    ],
  },
  {
    id: 'vandalismo', name: 'Vandalismo', organ: 'prefeitura',
    subcategories: [
      { id: 'pichacao', name: 'Pichação', categoryId: 'vandalismo' },
      { id: 'descarte_irregular', name: 'Descarte Irregular de Lixo', categoryId: 'vandalismo' },
      { id: 'destruicao_patrimonio', name: 'Destruição de Patrimônio Público', categoryId: 'vandalismo' },
    ],
  },
];

// Dados fictícios removidos. Ocorrências e convites de validação reais vêm
// do backend Node (ProjetoZup-main) via useOccurrences() / listValidationRequests().

export const organLabels: Record<OrganType, string> = {
  prefeitura: 'Prefeitura Municipal',
  agua_saneamento: 'Água e Saneamento',
  energia_luz: 'Energia e Iluminação',
};

export const statusLabels: Record<ReportStatus, string> = {
  pre_publicacao: 'Pré-publicação (12h)',
  aguardando_validacao: 'Aguardando Validação',
  em_analise: 'Em Análise',
  em_execucao: 'Em Execução',
  resolvido: 'Resolvido pelo Órgão',
  resolucao_validada: 'Resolução Validada',
  resolucao_rejeitada: 'Resolução Rejeitada',
  arquivado: 'Arquivado',
};

export const getStatusColor = (status: ReportStatus): string => {
  const map: Record<ReportStatus, string> = {
    pre_publicacao: '#9CA3AF',
    aguardando_validacao: '#A855F7',
    em_analise: '#EAB308',
    em_execucao: '#0D9488',
    resolvido: '#22C55E',
    resolucao_validada: '#16A34A',
    resolucao_rejeitada: '#EF4444',
    arquivado: '#6B7280',
  };
  return map[status];
};

export const getCategoryById = (id: string) => categories.find(c => c.id === id);
export const getSubcategoryById = (categoryId: string, subcategoryId: string) =>
  getCategoryById(categoryId)?.subcategories.find(s => s.id === subcategoryId);

// dashboardStats removido. As estatísticas reais são calculadas pelos hooks
// useCityOverview / useNeighborhoodStats / useCategoryStats / useOrganStats
// em src/hooks/useStats.ts, a partir das ocorrências reais do backend.
