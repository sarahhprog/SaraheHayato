# Configuração do Supabase

## 1. Criar e configurar o projeto

1. Crie um projeto em [supabase.com/dashboard](https://supabase.com/dashboard) e aguarde o banco ficar disponível.
2. Em **Project Settings → API**, copie a Project URL e a chave pública `anon`/publishable. Não use a chave `service_role` no site.
3. Abra **SQL Editor**, crie uma consulta e execute todo o arquivo [`supabase/migrations/20261109210000_schema.sql`](./supabase/migrations/20261109210000_schema.sql). O SQL cria as tabelas, índices, função de RSVP, políticas RLS, bucket público de imagens e políticas de Storage.
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
