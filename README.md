# 🕵️ ForensecDMX  
**Aplicativo de Investigação Digital com Múltiplas Ferramentas Forenses**

Este projeto tem como objetivo fornecer uma solução integrada para análise forense digital em ambientes Windows. O aplicativo reúne diversas funcionalidades essenciais para investigações técnicas, permitindo que profissionais da área realizem inspeções detalhadas em arquivos, processos e conexões suspeitas de forma rápida e eficiente.

---

## 📦 Funcionalidades

### 🔍 Explorador de Metadados  
Extração de atributos ocultos de arquivos, como datas de criação, modificação, autorias e permissões.

<img width="1088" height="587" alt="Captura de tela de 2025-09-02 11-58-37" src="https://github.com/user-attachments/assets/5844daee-4f1c-4ded-a61f-19106e208b77" />


### 🧬 Visualizador Hexadecimal  
Leitura em baixo nível de arquivos binários, permitindo a identificação de assinaturas digitais e estruturas ocultas.

<img width="1088" height="587" alt="Captura de tela de 2025-09-02 12-04-44" src="https://github.com/user-attachments/assets/4b3cd9d6-6ee1-4b9a-bf80-c06a574d07f9" />


### 📅 Linha do Tempo de Acessos  
Organização cronológica de eventos e acessos a arquivos, facilitando a reconstrução de atividades suspeitas.

<img width="1088" height="587" alt="Imagem colada" src="https://github.com/user-attachments/assets/ca8fc611-1d59-4361-80a6-9ff229484a0b" />


### 🌐 Conexões Suspeitas  
Monitoramento de conexões de rede em tempo real, com alerta para padrões anômalos e portas vulneráveis.

<img width="1088" height="587" alt="Imagem colada (2)" src="https://github.com/user-attachments/assets/1ceb9574-e575-4904-901d-b064896d8c77" />

### ⚙️ Monitor de Processos  
Detecção de processos ativos e análise de comportamento, com foco em atividades maliciosas ou não autorizadas.

<img width="1088" height="587" alt="Imagem colada (2)" src="https://github.com/user-attachments/assets/61e9572f-561a-4943-a88c-78e73c2d836d" />


### 📄 Análise de Arquivos PDF  
Inspeção de metadados, scripts embutidos e conteúdo oculto em documentos PDF.

<img width="1088" height="587" alt="Captura de tela de 2025-09-02 12-06-29" src="https://github.com/user-attachments/assets/0282fb48-5e73-4c54-bf9f-5ce6275579d9" />


---

## 🛠️ Tecnologias Utilizadas

- **Electron** – Framework para criação de aplicativos desktop com JavaScript, HTML e CSS  
- **Node.js** – Backend leve e eficiente para manipulação de arquivos e processos  
- **JavaScript** – Lógica principal e integração entre módulos  

---

## 🚀 Como Executar

### 🔧 Requisitos

- Node.js (versão 16 ou superior)  
- Electron (pré-instalado via `npm`)  
- Sistema operacional: Windows 10 ou superior

## 📥 Instalador

Se preferir instalar diretamente sem compilar, baixe o instalador executável:

**🔗 [Download do ForensecDMX Setup.exe](https://1drv.ms/u/c/220efbc97bc9fac5/EcDT4Q4tTfJCuHuMQm7r6fIBvLVjo2bDaR109v3Rb9sbCA?e=eEAYHb)**

---

## ⚠️ Observações

- Execute o instalador como **administrador** para garantir acesso completo às funcionalidades.
- O instalador foi gerado com `electron-builder` e está hospedado via OneDrive.
- Compatível com **Windows 10 ou superior**.


### 📂 Passo a Passo

```bash
# Clone o repositório
git clone https://github.com/Alexandre-Paulo-Silva/forensecDMX

# Acesse a pasta do projeto
cd forensecdmx

# Instale as dependências
npm install

# Execute o aplicativo em modo de desenvolvimento
npm start
