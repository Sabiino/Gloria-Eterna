export type TentMissionStatus = 'pending' | 'available' | 'complete';

/** Visual-only preview content. Replace with Firestore-backed missions when gameplay ships. */
export const tentLevelOnePreview = {
  mission: {
    code: 'MISSÃO 001', title: 'UM NOVO COMEÇO',
    description: 'Prepare seu primeiro acampamento e descubra como iniciar sua jornada.',
    objectives: [
      { title: 'Conhecer a Barraca Central', description: 'Explore o coração do seu acampamento.', status: 'complete' as TentMissionStatus },
      { title: 'Organizar os equipamentos', description: 'Deixe tudo pronto para a jornada.', status: 'available' as TentMissionStatus },
      { title: 'Construir a primeira fogueira', description: 'Uma construção estará disponível em breve.', status: 'pending' as TentMissionStatus },
    ],
  },
  requirements: [
    { icon: '🪵', name: 'Madeiras', amount: 80 }, { icon: '🪨', name: 'Pedras', amount: 25 },
    { icon: '🌾', name: 'Fibras naturais', amount: 20 }, { icon: '✓', name: 'Concluir Missão 001', amount: null },
    { icon: '◷', name: 'Tempo', amount: '5 min' },
  ],
  unlocks: [
    { icon: '🔥', name: 'Fogueira', level: 1, description: 'Luz e calor para o acampamento.', available: true },
    { icon: '🪵', name: 'Banco de madeira', level: 1, description: 'Um lugar para descansar.', available: true },
    { icon: '🪧', name: 'Placa do acampamento', level: 1, description: 'Dê boas-vindas aos visitantes.', available: true },
    { icon: '🛤', name: 'Caminho de terra', level: 1, description: 'Organize os primeiros trajetos.', available: true },
    { icon: '📦', name: 'Depósito de Materiais', level: 2, description: 'Guarde recursos com segurança.', available: false },
    { icon: '⚒', name: 'Oficina de Ferramentas', level: 3, description: 'Prepare novas ferramentas.', available: false },
    { icon: '🌲', name: 'Ampliação do terreno', level: 3, description: 'Abra espaço para o futuro.', available: false },
  ],
} as const;
