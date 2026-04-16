    const app = window.TechHelpApp;
    const ticketId = new URLSearchParams(window.location.search).get("id");
    const commentsMessage = document.getElementById("comments-message");
    const commentsList = document.getElementById("comments-list");
    const commentForm = document.getElementById("comment-form");
    const commentInput = document.getElementById("comment-message");
    const submitButton = document.getElementById("submit-button");
    const formMessage = document.getElementById("form-message");
    const headerHomeLink = document.getElementById("header-home-link");

    let currentUser = null;

    function getHomePath() {
      return currentUser?.role === "Tecnico" ? "./home-tecnico.html" : "./home-usuario.html";
    }

    function goBackHome() {
      window.location.href = getHomePath();
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

    function getPriorityClasses(priorityName) {
      const normalized = (priorityName || "").toLowerCase();
      if (normalized.includes("alta")) {
        return "bg-red-100 text-red-800";
      }
      if (normalized.includes("media") || normalized.includes("mÃ©dia")) {
        return "bg-yellow-100 text-yellow-800";
      }
      return "bg-green-100 text-green-800";
    }

    function roleLabel(role) {
      if (role === "Tecnico") {
        return "Tecnico";
      }
      if (role === "Admin") {
        return "Gestor";
      }
      return "Usuario";
    }

    function showFormMessage(text, type) {
      formMessage.textContent = text;
      formMessage.className = "text-sm rounded-md px-3 py-2";
      if (type === "error") {
        formMessage.classList.add("bg-red-50", "text-red-700", "border", "border-red-200");
      } else {
        formMessage.classList.add("bg-green-50", "text-green-700", "border", "border-green-200");
      }
    }

    function renderTicket(chamado) {
      document.getElementById("ticket-number").textContent = `Chamado #${chamado.id}`;
      document.getElementById("ticket-title").textContent = chamado.titulo || "Sem titulo";
      document.getElementById("ticket-description").textContent = chamado.descricao || "";
      document.getElementById("ticket-category").textContent = chamado.categoria?.nome || "-";
      document.getElementById("ticket-priority").textContent = chamado.prioridade?.nome || "-";
      document.getElementById("ticket-priority").className = `inline-flex items-center rounded-full px-3 py-1 ${getPriorityClasses(chamado.prioridade?.nome)}`;
      document.getElementById("ticket-status").textContent = chamado.status?.nome || "-";
      document.getElementById("ticket-status").className = `inline-flex items-center rounded-full px-3 py-1 ${getStatusClasses(chamado.status?.nome)}`;
    }

    function renderComments(comentarios) {
      if (!comentarios.length) {
        commentsMessage.textContent = "Nenhum comentario enviado ainda.";
        commentsMessage.classList.remove("hidden");
        commentsList.classList.add("hidden");
        return;
      }

      commentsMessage.classList.add("hidden");
      commentsList.classList.remove("hidden");
      commentsList.innerHTML = comentarios.map((comentario) => {
        const isMine = String(comentario.usuario?.id) === String(currentUser?.userId);
        return `
          <div class="flex ${isMine ? "justify-end" : "justify-start"}">
            <div class="max-w-2xl rounded-2xl px-4 py-3 shadow-sm ${isMine ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"}">
              <div class="flex items-center justify-between gap-4 text-xs ${isMine ? "text-blue-100" : "text-gray-500"} mb-2">
                <span class="font-semibold">${comentario.usuario?.nome || "Usuario"} • ${roleLabel(comentario.usuario?.tipo)}</span>
                <span>${app.formatDate(comentario.dataEnvio)}</span>
              </div>
              <p class="text-sm whitespace-pre-wrap">${comentario.mensagem}</p>
            </div>
          </div>
        `;
      }).join("");
    }

    async function loadComments() {
      const response = await app.apiFetch(`/api/chamados/${ticketId}/comentarios`);
      const data = await app.readResponse(response);

      if (!response.ok) {
        throw new Error(typeof data === "string" ? data : "Nao foi possivel carregar os comentarios.");
      }

      renderComments(Array.isArray(data) ? data : []);
    }

    async function loadTicket() {
      const response = await app.apiFetch(`/api/chamados/${ticketId}`);
      const data = await app.readResponse(response);

      if (!response.ok || !data) {
        throw new Error(typeof data === "string" ? data : "Nao foi possivel carregar o chamado.");
      }

      renderTicket(data);
    }

    commentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      formMessage.className = "hidden";
      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Enviando...";

      try {
        const response = await app.apiFetch(`/api/chamados/${ticketId}/comentarios`, {
          method: "POST",
          body: JSON.stringify({
            mensagem: commentInput.value.trim()
          })
        });

        const data = await app.readResponse(response);
        if (!response.ok) {
          throw new Error(typeof data === "string" ? data : "Nao foi possivel enviar o comentario.");
        }

        commentInput.value = "";
        showFormMessage("Comentario enviado com sucesso.", "success");
        await loadComments();
      } catch (error) {
        showFormMessage(error.message || "Erro ao enviar comentario.", "error");
      } finally {
        submitButton.disabled = false;
        submitButton.querySelector("span").textContent = "Enviar comentario";
      }
    });

    document.getElementById("back-button").addEventListener("click", goBackHome);

    (async () => {
      if (!ticketId) {
        window.location.href = "./home-usuario.html";
        return;
      }

      const user = await app.requireAuth(["Usuario", "Tecnico"]);
      if (!user) {
        return;
      }

      currentUser = user;
      headerHomeLink.href = getHomePath();
      app.attachLogout();

      try {
        await Promise.all([loadTicket(), loadComments()]);
      } catch (error) {
        commentsMessage.textContent = error.message || "Erro ao carregar comentarios.";
        commentsMessage.classList.remove("hidden");
        commentsList.classList.add("hidden");
      }
    })();
  

