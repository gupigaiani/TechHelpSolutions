    const app = window.TechHelpApp;
    const priorityFilter = document.getElementById("priority-filter");
    const statusFilter = document.getElementById("status-filter");
    const techMessage = document.getElementById("tech-message");
    const techTicketList = document.getElementById("tech-ticket-list");
    const techTotal = document.getElementById("tech-total");

    let prioritiesMap = new Map();
    let statusMap = new Map();

    function getPriorityClasses(priorityName) {
      const normalized = (priorityName || "").toLowerCase();
      if (normalized.includes("alta")) {
        return "bg-red-100 text-red-800";
      }
      if (normalized.includes("mÃ©dia")) {
        return "bg-yellow-100 text-yellow-800";
      }
      return "bg-green-100 text-green-800";
    }

    function getStatusClasses(statusName) {
      const normalized = (statusName || "").toLowerCase();
      if (normalized.includes("andamento")) {
        return "bg-blue-100 text-blue-800";
      }
      if (normalized.includes("final") || normalized.includes("resolvido")) {
        return "bg-green-100 text-green-800";
      }
      return "bg-yellow-100 text-yellow-800";
    }

    function showMessage(text, isError = false) {
      techMessage.textContent = text;
      techMessage.className = `px-6 py-6 text-sm ${isError ? "text-red-600" : "text-gray-500"}`;
      techMessage.classList.remove("hidden");
      techTicketList.classList.add("hidden");
    }

    function fillSelect(select, items, defaultLabel) {
      select.innerHTML = `<option value="">${defaultLabel}</option>${items.map((item) => `<option value="${item.id}">${item.nome}</option>`).join("")}`;
    }

    async function loadFilters() {
      const [prioritiesResponse, statusResponse] = await Promise.all([
        app.apiFetch("/api/catalogos/prioridades"),
        app.apiFetch("/api/catalogos/status")
      ]);

      const priorities = await app.readResponse(prioritiesResponse);
      const statuses = await app.readResponse(statusResponse);

      if (!prioritiesResponse.ok || !statusResponse.ok) {
        throw new Error("Nao foi possivel carregar os filtros.");
      }

      prioritiesMap = new Map((priorities || []).map((item) => [String(item.id), item.nome]));
      statusMap = new Map((statuses || []).map((item) => [String(item.id), item.nome]));

      fillSelect(priorityFilter, priorities || [], "Todas");
      fillSelect(statusFilter, statuses || [], "Todos");
    }

    function renderTickets(chamados) {
      techTotal.textContent = `${chamados.length} ${chamados.length === 1 ? "item" : "itens"}`;

      if (!chamados.length) {
        showMessage("Nenhum chamado encontrado para os filtros selecionados.");
        return;
      }

      techMessage.classList.add("hidden");
      techTicketList.classList.remove("hidden");
      techTicketList.innerHTML = chamados.map((chamado) => `
        <div class="px-6 py-4 hover:bg-gray-50 flex justify-between gap-4 flex-col lg:flex-row">
          <div>
            <div class="flex items-center flex-wrap gap-2 mb-2">
              <span class="text-sm text-gray-500">#${chamado.id}</span>
              <span class="text-xs px-2 py-1 rounded ${getPriorityClasses(chamado.prioridade?.nome)}">${chamado.prioridade?.nome || "-"}</span>
              <span class="text-sm text-gray-700">${chamado.categoria?.nome || "-"}</span>
              <span class="text-xs px-3 py-1 rounded-full ${getStatusClasses(chamado.status?.nome)}">
                ${chamado.status?.nome || "Sem status"}
              </span>
            </div>

            <h3 class="text-base font-medium text-gray-900">${chamado.titulo}</h3>
            <p class="text-sm text-gray-600 mt-1">${chamado.descricao}</p>

            <div class="mt-2 text-xs text-gray-500 flex flex-wrap gap-3">
              <span>Criado: ${app.formatDate(chamado.dataAbertura)}</span>
              <span>Solicitante: ${chamado.usuario?.nome || "-"}</span>
              <span>Tecnico: ${chamado.tecnico?.nome || "Não atribuido"}</span>
            </div>
          </div>

          <div class="flex flex-col gap-2 lg:min-w-40">
            <a href="./comentarios.html?id=${chamado.id}" class="inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-icon lucide-message-square"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/></svg>
              <span>Abrir Comentários</span>
            </a>
            <button data-action="assumir" data-id="${chamado.id}" class="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300" ${chamado.tecnicoId ? "disabled" : ""}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="text-white shrink-0">
                <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
              <span>${chamado.tecnicoId ? "Assumido" : "Assumir"}</span>
            </button>
            <button data-action="editar" data-id="${chamado.id}" class="inline-flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="text-white shrink-0">
                <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
              </svg>
              <span>Editar</span>
            </button>
            <button data-action="finalizar" data-id="${chamado.id}" class="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-300" ${(!chamado.tecnicoId || (chamado.status?.nome || "").toLowerCase().includes("final") || (chamado.status?.nome || "").toLowerCase().includes("resolvido")) ? "disabled" : ""}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="text-white shrink-0">
                <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                <path d="m9 11 3 3L22 4"></path>
              </svg>
              <span>Finalizar</span>
            </button>
          </div>
        </div>
      `).join("");
    }

    async function loadTickets() {
      const params = new URLSearchParams();
      if (priorityFilter.value) {
        params.set("prioridade", priorityFilter.value);
      }
      if (statusFilter.value) {
        params.set("status", statusFilter.value);
      }

      const path = params.toString() ? `/api/chamados?${params.toString()}` : "/api/chamados";
      const response = await app.apiFetch(path);
      const data = await app.readResponse(response);

      if (!response.ok) {
        throw new Error(typeof data === "string" ? data : "Nao foi possivel carregar os chamados.");
      }

      renderTickets(Array.isArray(data) ? data : []);
    }

    async function handleAction(action, chamadoId) {
      if (action === "editar") {
        window.location.href = `./abrir-chamado.html?id=${chamadoId}`;
        return;
      }

      const endpoint = action === "assumir"
        ? `/api/chamados/${chamadoId}/assumir`
        : `/api/chamados/${chamadoId}/finalizar`;

      const response = await app.apiFetch(endpoint, { method: "PUT" });
      if (!response.ok) {
        const data = await app.readResponse(response);
        throw new Error(typeof data === "string" ? data : "Nao foi possivel executar a acao.");
      }
    }

    priorityFilter.addEventListener("change", async () => {
      try {
        await loadTickets();
      } catch (error) {
        showMessage(error.message || "Erro ao filtrar chamados.", true);
      }
    });

    statusFilter.addEventListener("change", async () => {
      try {
        await loadTickets();
      } catch (error) {
        showMessage(error.message || "Erro ao filtrar chamados.", true);
      }
    });

    techTicketList.addEventListener("click", async (event) => {
      const button = event.target.closest("button[data-action]");
      if (!button) {
        return;
      }

      const action = button.dataset.action;
      const chamadoId = button.dataset.id;
      const originalLabel = button.textContent.trim();

      try {
        button.disabled = true;
        button.textContent = "Processando...";
        await handleAction(action, chamadoId);
        await loadTickets();
      } catch (error) {
        alert(error.message || "Erro ao processar a acao.");
        button.disabled = false;
        button.textContent = originalLabel;
      }
    });

    (async () => {
      const user = await app.requireAuth(["Tecnico"]);
      if (!user) {
        return;
      }

      app.attachLogout();

      try {
        await loadFilters();
        await loadTickets();
      } catch (error) {
        showMessage(error.message || "Erro ao carregar o dashboard do tecnico.", true);
      }
    })();
  

