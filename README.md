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

### 📅 Linha do Tempo de Acessos  
Organização cronológica de eventos e acessos a arquivos, facilitando a reconstrução de atividades suspeitas.

### 🌐 Conexões Suspeitas  
Monitoramento de conexões de rede em tempo real, com alerta para padrões anômalos e portas vulneráveis.

### ⚙️ Monitor de Processos  
Detecção de processos ativos e análise de comportamento, com foco em atividades maliciosas ou não autorizadas.

### 📄 Análise de Arquivos PDF  
Inspeção de metadados, scripts embutidos e conteúdo oculto em documentos PDF.

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
