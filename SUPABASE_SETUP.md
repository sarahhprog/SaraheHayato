# Configuração do Supabase

## 1. Criar e configurar o projeto

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard) e aguarde o banco ficar disponível.
2. Em **Project Settings → API**, copie a Project URL e a chave pública `anon`/publishable. Não use a chave `service_role` no site.
3. Abra **SQL Editor**, crie uma consulta e execute, nesta ordem, [`supabase/migrations/20261109210000_schema.sql`](./supabase/migrations/20261109210000_schema.sql) e [`supabase/migrations/20261111200000_gifts_payments.sql`](./supabase/migrations/20261111200000_gifts_payments.sql). A segunda migração cria e semeia os presentes, tentativas e compras, além das políticas RLS e da confirmação transacional do pagamento.
4. Em **Authentication → Providers**, mantenha Email habilitado. Em **Authentication → Settings**, desabilite o cadastro público de usuários.
5. Em **Authentication → Users**, crie o usuário administrador com o e-mail `arauujjosarah@gmail.com` e defina uma senha forte diretamente no Supabase. Não reutilize uma senha que já foi compartilhada em uma conversa. Depois execute no SQL Editor:

   ```sql
   update auth.users
   set raw_app_meta_data =
     coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
   where email = lower('arauujjosarah@gmail.com');
   ```

   O usuário deve sair e entrar de novo depois de alterar o papel. Somente usuários com `app_metadata.role = admin` passam nas políticas do painel.
6. O bucket `site-images` é criado pelo SQL com leitura pública e limite de 8 MB. Confirme em **Storage → Buckets** que existe e está marcado como público. Se preferir criá-lo manualmente, use exatamente o nome `site-images`, marque **Public bucket**, limite o tamanho a 8 MB e permita `image/jpeg`, `image/png` e `image/webp`; mantenha as políticas RLS criadas pelo SQL.

## 2. Variáveis locais

Copie `.env.example` para `.env.local` e preencha com os valores do passo 2:

```env
VITE_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON_OU_PUBLISHABLE
```

Reinicie `npm run dev` depois de alterar as variáveis. A chave pública é destinada ao navegador e fica protegida pelas políticas RLS. **Nunca** inclua uma chave `service_role` no `.env` com prefixo `VITE_`, no código ou na Vercel.

## 3. Variáveis na Vercel

No projeto da Vercel, abra **Settings → Environment Variables** e adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para Production, Preview e Development. Salve e faça um novo deploy para que o Vite incorpore as variáveis ao build.

## 4. Como testar

1. Abra o site em uma janela anônima e envie uma resposta com nome completo; escolha **Vou comparecer** ou **Não poderei ir**. Deve aparecer a confirmação apropriada.
2. Envie novamente com o mesmo nome (inclusive teste diferenças de acento/maiúsculas). O site deve oferecer **Atualizar resposta** em vez de criar duplicata.
3. Entre em **Acesso administrativo** com o usuário criado no Supabase. Na aba **Convidados**, confirme que a resposta aparece com status e data/hora.
4. Edite o nome inline, mude o status e confira que os totais refletem os dados do banco. Exclua um registro e confirme que ele some da tabela.
5. Em **Conteúdo**, altere um texto, salve e confira no site público. Em **Fotos**, selecione uma imagem, confira a prévia e salve; a imagem comprimida é enviada a `site-images`.
6. Confirme que uma sessão anônima não consegue consultar `guests` nem inserir/alterar/excluir diretamente pela API REST. O RSVP público usa somente a função RPC limitada; os dados de convidados não são retornados ao navegador público.

## Modelo de segurança e limite do RSVP por nome

RLS bloqueia consultas e operações diretas de visitantes anônimos sobre `guests`. O RSVP anônimo chama `submit_rsvp`, que aceita somente um nome de 2 a 100 caracteres e um dos dois estados permitidos; uma resposta duplicada requer confirmação no site. O banco não retorna nomes, status ou listas ao visitante.

Como o formulário foi deliberadamente mantido apenas com nome, o banco não tem como provar a identidade do visitante: alguém que saiba o nome de outra pessoa pode enviar ou atualizar a resposta dela. O aviso de duplicidade evita duplicatas acidentais, mas não substitui verificação de identidade. Para impedir essa possibilidade, adicione uma verificação privada (por exemplo, link/código por e-mail) antes de permitir atualização.

O painel autentica via Supabase Auth e as políticas requerem a claim administrativa em `app_metadata`. Desabilite novos cadastros no Auth; não use `user_metadata` para conceder privilégios, pois o próprio usuário pode alterá-la. Fotos são publicamente legíveis por solicitação e somente admin pode gravar/remover. Ao remover uma foto personalizada, o site usa a imagem padrão existente.

## Lista de presentes e Mercado Pago (modo de teste)

O Supabase foi escolhido porque o projeto já usa Auth e RLS, e as Edge Functions hospedadas evitam manter um servidor Express separado. O plano gratuito é suficiente para começar; a hospedagem das funções e do banco fica no Supabase.

O banco já recebe oito presentes fictícios pela segunda migração. Visitantes podem ler somente `gifts`; tentativas e compras não têm leitura pública. A compra e a mudança para `unavailable` acontecem numa função SQL transacional chamada exclusivamente pelo webhook com a chave de serviço. A restrição única em `gift_purchases.gift_id` protege contra dois pagamentos aprovados para o mesmo presente.

### Configuração hospedada

1. No painel do Mercado Pago, crie/consulte as **credenciais de teste** e copie um access token `TEST-...`. Configure uma URL de notificação do tipo **Webhook** e guarde o segredo de assinatura (`x-signature`/secret key).
2. No Supabase, salve os valores como secrets das Edge Functions. Use a URL pública do site em `SITE_URL` e a URL abaixo em `MP_WEBHOOK_URL`:

   ```text
   https://SEU_PROJECT_ID.supabase.co/functions/v1/mercado-pago-webhook
   ```

   Configure a mesma URL de webhook no painel do Mercado Pago. O `MP_WEBHOOK_SECRET` deve ser o segredo de assinatura gerado para essa configuração.
3. Faça deploy:

   ```powershell
   supabase login
   supabase link --project-ref SEU_PROJECT_ID
   supabase functions deploy create-preference
   supabase functions deploy mercado-pago-webhook
   ```

   Cadastre `SITE_URL`, `MP_WEBHOOK_URL`, `MP_ACCESS_TOKEN`, `MP_TEST_MODE=true` e `MP_WEBHOOK_SECRET` em **Supabase → Edge Functions → Secrets** (ou com `supabase secrets set --env-file CAMINHO_DO_ARQUIVO`). Com `MP_TEST_MODE=true`, a função exige access token `TEST-...` e usa somente o checkout de teste. O Supabase fornece `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no runtime das funções. Nunca use o access token nem a service-role key em variáveis `VITE_*`.
4. No site, mantenha apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env.local` e na hospedagem do frontend. O `.gitignore` já ignora `.env*`, com exceção dos arquivos `.env.example`.
5. Se o site estiver hospedado como SPA, configure o host para servir `index.html` nas rotas `/rsvp`, `/presentes`, `/informacoes`, `/admin`, `/pagamento/sucesso`, `/pagamento/pendente` e `/pagamento/falha`.

O Mercado Pago devolve o navegador para páginas informativas. Parâmetros dessa URL não são usados para concluir a compra: o webhook valida a assinatura, consulta o pagamento na API do Mercado Pago, confere referência, status, moeda e valor e só então confirma no banco.

### Teste local

1. Instale o Supabase CLI, inicie o ambiente local e aplique as migrações:

   ```powershell
   supabase start
   supabase migration up
   supabase status
   ```

2. Copie `supabase/functions/.env.example` para `supabase/functions/.env`. Preencha `MP_ACCESS_TOKEN` com credencial de teste, `MP_WEBHOOK_SECRET` com o segredo do webhook, `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com os valores locais de `supabase status`.
3. Inicie as funções e o site em terminais separados:

   ```powershell
   supabase functions serve --env-file supabase/functions/.env
   pnpm dev
   ```

   Para o navegador usar o Supabase local, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores locais mostrados pelo CLI em `.env.local`.
4. O Mercado Pago precisa alcançar o webhook pela internet. Exponha `http://127.0.0.1:54321` com um túnel HTTPS e coloque a URL pública terminada em `/functions/v1/mercado-pago-webhook` em `MP_WEBHOOK_URL` e no painel do Mercado Pago. `SITE_URL` também deve ser uma URL HTTPS acessível publicamente para o checkout poder retornar ao site; exponha o Vite por outro túnel ou use uma URL de preview hospedada e abra o site por essa mesma origem. Reinicie o servidor local das funções depois de alterar o arquivo `.env`.

### Roteiro de teste

1. Na página **Lista de presentes**, tente enviar nome vazio ou mensagem vazia; o botão deve permanecer desabilitado. Envie dados válidos e confirme que o checkout mostra o valor fixo do presente.
2. Faça um pagamento aprovado com comprador e meio de pagamento de teste do Mercado Pago. Aguarde o webhook; o painel `/admin` deve mostrar a compra e o total, e o presente deve ficar indisponível. Recarregar a página de sucesso sem um pagamento aprovado não deve mudar o banco.
3. Tente outro pagamento com cartão de teste recusado. O presente deve continuar disponível; a tentativa aparece somente na área administrativa.
4. Inicie um checkout e abandone-o sem pagar. O presente deve continuar disponível e a tentativa permanece pendente.
5. Para testar concorrência, inicie dois checkouts para o mesmo presente antes de pagar e aprove ambos. A primeira compra confirmada fica vinculada ao presente; a segunda aparece em destaque como `Duplicado — precisa de reembolso`, sem criar outra compra nem alterar os dados da primeira.

O reembolso de um pagamento duplicado é **manual** nesta entrega: abra o pagamento pelo ID exibido no painel do Mercado Pago, selecione **Reembolsar** e confirme. O backend não dispara reembolsos automaticamente. O webhook pode atualizar o status da tentativa após o Mercado Pago processar o reembolso.
