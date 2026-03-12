
# G4L - Games for Life 🎮
### **A Revolução do Acesso ao Entretenimento Digital**

> **"Transformando o custo de aquisição em facilidade de acesso."**

O **G4L (Games for Life)** é um ecossistema full-stack completo desenvolvido para gerenciar o ciclo de vida de aluguéis de hardware e software de jogos. Inspirado na disrupção gerada pela **Mottu** no setor de logística, o G4L aplica o conceito de **Economia Compartilhada** e **Product-as-a-Service (PaaS)** para democratizar o acesso a consoles de última geração e títulos premium.

---

## 🔗 Links Rápidos
* **Frontend (Live):** [Visualizar Site](https://g4-l-angular.vercel.app/home)
* **Repositório Frontend:** [G4L_Angular](https://github.com/EduBonfim/G4L_Angular)
* **Repositório Backend:** [G4L-Spring](https://github.com/EduBonfim/G4L-Spring)

---

## 💎 A Proposta de Valor

Muitos entusiastas de jogos enfrentam a barreira do alto custo inicial de consoles e mídias. O G4L resolve isso através de:
* **Acessibilidade Financeira:** Substitui o investimento de alto valor por micro-pagamentos recorrentes.
* **Flexibilidade:** Permite desfrutar de diferentes plataformas (PlayStation, Xbox, Nintendo) sem a necessidade de compra imediata.
* **Escalabilidade de Gestão:** Backoffice projetado para suportar desde operações pequenas até frotas logísticas complexas.

---

## 🛡️ Área Administrativa e Segurança

Diferente de sistemas simples, o G4L entrega uma ferramenta de gestão empresarial (ERP) simplificada para o administrador:

* **Controle de Ativos:** Gestão granular de cada console e jogo (CRUD completo) com atualizações em tempo real.
* **Inteligência Operacional:** Acompanhamento de locações ativas e funcionalidade de **extensão de prazos** diretamente pelo painel.
* **Data Insights:** Módulo de exportação para **CSV**, transformando registros de banco de dados em relatórios acionáveis para análise de faturamento.
* **Segurança:** Sistema de criação de usuários com **regras de segurança rigorosas**, garantindo a proteção de dados sensíveis e níveis de acesso restritos.

---

## 🚀 Desafios Técnicos e Aprendizados

O desenvolvimento do G4L apresentou desafios de engenharia que foram fundamentais para nossa evolução:

1.  **Integração de Sistemas Distribuídos:** A maior dificuldade foi fazer com que o Frontend (Angular), o Backend (Spring Boot) e o Banco de Dados (PostgreSQL) funcionassem perfeitamente de forma isolada para, então, estabelecer uma comunicação fluida e segura entre eles via API REST.
2.  **Lógica de Logística:** Implementar a manipulação de datas para gerenciar períodos de locação, cálculos de devolução e extensões de prazo sem gerar conflitos de disponibilidade no inventário.
3.  **Processamento de Dados:** Organizar a serialização de objetos complexos para a geração de arquivos CSV, garantindo que o relatório final fosse legível e útil para a gestão.

---

## 🛠️ Tecnologias

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend** | Angular, Tailwind CSS, TypeScript |
| **Backend** | Java, Spring Boot (Security, Data JPA, Web) |
| **Banco de Dados** | PostgreSQL & PLpgSQL |
| **DevOps** | Docker, Vercel (Front), Render (Back & DB) |

---

## 🤝 Desenvolvedores

Este projeto foi desenvolvido em colaboração Full-Stack, com ambos os integrantes atuando em todas as etapas do ciclo de vida do software.

<table align="center">
  <tr>
    <td align="center">
      <a href="https://github.com/EduBonfim">
        <img src="https://github.com/EduBonfim.png" width="100px;" alt="Eduardo Domingues"/><br />
        <sub><b>Eduardo Domingues</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/bigkaique">
        <img src="https://github.com/bigkaique.png" width="100px;" alt="Kaique Felipe"/><br />
        <sub><b>Kaique Felipe</b></sub>
      </a>
    </td>
  </tr>
</table>

---

### Como rodar este projeto localmente
1.  **Clone os repositórios** do Front e do Back.
2.  **Backend:** Configure o `application.properties` com suas credenciais Postgres e execute `./mvnw spring-boot:run`.
3.  **Frontend:** Execute `npm install` e `ng serve`. Acesse `http://localhost:4200`.
