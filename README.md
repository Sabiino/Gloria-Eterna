# Gloria Eterna

Fundação multiplataforma (Expo Router, TypeScript estrito, Firebase modular) para o jogo de aventura e acampamento.

## Executar

1. Copie `.env.example` para `.env` e preencha as credenciais do seu projeto Firebase.
2. No Firebase Console, habilite **Email/Password**, crie o Firestore e aplique `firestore.rules`.
3. Execute `npm install`, depois `npx expo start`.
4. Use `npm run web`, `npm run android` ou `npm run ios` para cada destino.

## Firebase e segurança

As chaves `EXPO_PUBLIC_FIREBASE_*` identificam o projeto cliente; não são service accounts. Para produção, implante `functions/` e faça o app chamar `initializePlayer`: ela reserva apelido em transação e cria o estado inicial de modo idempotente. As regras bloqueiam escrita direta do cliente em recursos do jogo.

Antes de lançamento público, revisar consentimento parental/LGPD, moderação de apelidos, exclusão de dados e processo de suporte. A caixa de aceite não substitui essa revisão.

## Pronto agora

- Fluxos de login, cadastro, recuperação de senha e sessão, conectados ao Firebase quando configurado.
- Onboarding em quatro etapas com avatar, perfil público/privado e acampamento.
- Mundo isométrico Canvas com ilha procedural de 256×256 células, arrasto, zoom, seleção de terreno, avatar e barracas do setor.
- Estrutura para Camp, inventário, missões, ligas, mapa e Cloud Functions.

Não há multiplayer, mapa 3D, construção avançada ou movimentação sincronizada em tempo real nesta etapa.

## Mapa isométrico (Fase 03)

Após autenticar e concluir o perfil, a rota inicial abre o **Vale do Recomeço**. O mapa permite arrastar a câmera, usar a roda para zoom, escolher um terreno com prévia verde/vermelha, visualizar as barracas do setor e clicar/tocar para mover o avatar.

Para ativar o salvamento seguro, instale e publique as Cloud Functions:

```bash
cd functions
npm install
npm run build
cd ..
npx firebase-tools deploy --only functions,firestore:rules
```

`claimCampPlot` reserva transacionalmente o terreno e cria uma única Barraca Central nível 1 por usuário. `saveAvatarPosition` grava a posição ao fim da caminhada. Sem a publicação das funções, o mapa abre, mas a confirmação não salva ocupações diretamente pelo cliente.
