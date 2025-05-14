
# Documentação - Módulo Serviços

## Objetivo:
Este módulo serve para o gerenciamento dos serviços oferecidos pelo petshop, permitindo o cadastro, listagem, edição e exclusão de serviços, além da associação com um **status**.

## Arquitetura do Sistema:
- **Backend**: Node.js com Express, Sequelize (ORM), Postgres
- **Frontend**: HTML, CSS, JavaScript com Axios para requisições assíncronas
- **Banco de Dados**: PostgreSQL

---

## Funcionalidades para o Desenvolvedor:

1. **Estrutura de Banco de Dados**:
   O modelo de dados `Servicos` está estruturado com os seguintes campos:
   - **id**: Identificador único do serviço (auto incremento)
   - **descricao**: Descrição do serviço (campo obrigatório)
   - **statusId**: Chave estrangeira que referencia o status do serviço (campo obrigatório)
   
   A tabela `servicos` tem uma relação de muitos para um com a tabela `status`, o que significa que um serviço está associado a um único status, mas um status pode ser associado a vários serviços.

2. **Rotas e Endpoints**:
   As rotas para manipulação dos serviços são:
   - **POST /api/servicos** - Criação de um novo serviço.
     - Corpo da requisição: 
       ```json
       {
         "descricao": "Nome do serviço",
         "statusId": 1
       }
       ```
     - Resposta:
       ```json
       {
         "id": 1,
         "descricao": "Banho",
         "statusId": 1,
         "createdAt": "2025-05-14T08:00:00.000Z",
         "updatedAt": "2025-05-14T08:00:00.000Z",
         "status": {
           "descricao": "Ativo"
         }
       }
       ```

   - **GET /api/servicos** - Listagem de todos os serviços.
     - Resposta:
       ```json
       [
         {
           "id": 1,
           "descricao": "Banho",
           "statusId": 1,
           "status": {
             "descricao": "Ativo"
           }
         },
         {
           "id": 2,
           "descricao": "Tosa",
           "statusId": 2,
           "status": {
             "descricao": "Inativo"
           }
         }
       ]
       ```

   - **PUT /api/servicos/:id** - Edição de um serviço existente.
     - Corpo da requisição:
       ```json
       {
         "descricao": "Novo nome do serviço",
         "statusId": 2
       }
       ```
     - Resposta:
       ```json
       {
         "id": 1,
         "descricao": "Novo nome do serviço",
         "statusId": 2
       }
       ```

   - **DELETE /api/servicos/:id** - Exclusão de um serviço.
     - Resposta: `HTTP Status 204 (No Content)`

3. **Validação e Tratamento de Erros**:
   - A criação de um serviço exige que ambos os campos `descricao` e `statusId` sejam fornecidos. Se algum dos campos estiver ausente, a resposta será um erro 400 com a mensagem de que os campos são obrigatórios.
   - Em caso de erro no backend, a resposta será um erro 500 com detalhes do erro.

4. **Soft Delete**:
   O modelo de serviço foi configurado para utilizar o **soft delete**, o que significa que ao excluir um serviço, ele não é removido permanentemente do banco de dados. Ele é apenas marcado como "excluído" (flag `deletedAt`). 

5. **Sincronização do Banco de Dados**:
   No **app.js**, a função `sequelize.sync()` é chamada para garantir que as tabelas no banco de dados estejam sempre atualizadas com os modelos definidos no código.

---

## Funcionalidades para o Usuário:

#### 1. Cadastro de Serviço
   O usuário pode cadastrar novos serviços oferecidos pelo petshop, como:
   - Banho
   - Tosa
   - Hospedagem
   - Creche

   **Passos**:
   - O usuário preenche o nome do serviço e escolhe o status.
   - Após a submissão do formulário, o serviço será criado e exibido na interface com seus dados: ID, descrição e status.

   **Campos obrigatórios**:
   - **Descrição** do serviço
   - **Status** do serviço (Ativo/Inativo)

#### 2. Listagem de Serviços
   O sistema exibe todos os serviços cadastrados, incluindo o nome e status. O usuário pode visualizar todos os serviços e seus status na tabela fornecida pela interface.

#### 3. Edição de Serviço
   O usuário pode editar os dados de um serviço. Ao clicar no botão de editar, o formulário de cadastro é preenchido automaticamente com as informações do serviço selecionado. O usuário pode alterar o nome do serviço ou seu status.

#### 4. Exclusão de Serviço
   O usuário pode excluir um serviço da lista. A exclusão será feita via **soft delete**, ou seja, o serviço não será removido do banco de dados, mas sim marcado como excluído.

---

## Estrutura de Arquivos

**Backend**:
```
/backend
  /controllers
    - servicosController.js
  /models
    - Servicos.js
    - Status.js
  /routes
    - servicosRoutes.js
    - statusRoutes.js
  /config
    - db.js
  - app.js
```

**Frontend**:
```
/frontend
  /servicos
    - cad_servicos.html
    - cad_servicos.css
    - js
      - cad_servicos.js
  /css
    - global.css
  /js
    - utils.js
```

---

## Observações Finais:

- O módulo **Serviços** foi desenvolvido com foco na simplicidade e na experiência do usuário, permitindo a fácil gestão dos serviços oferecidos pelo petshop.
- O módulo pode ser expandido com novos recursos, como filtros de serviços por status ou categorias.
- O sistema usa **soft delete**, garantindo que os dados sejam preservados e possam ser restaurados, caso necessário.
