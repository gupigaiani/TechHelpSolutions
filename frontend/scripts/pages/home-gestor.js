    const app = window.TechHelpApp;
    const SLA_HOURS_LIMIT = 24;

    function formatDurationFromMinutes(totalMinutes) {
      if (!totalMinutes || totalMinutes < 1) {
        return "0min";
      }

      const hours = Math.floor(totalMinutes / 60);
      const minutes = Math.round(totalMinutes % 60);

      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}min`;
      }
      if (hours > 0) {
        return `${hours}h`;
      }
      return `${minutes}min`;
    }

    function setText(id, value) {
      document.getElementById(id).textContent = value;
    }

    function setWidth(id, value) {
      document.getElementById(id).style.width = `${value}%`;
    }

    function renderMetrics(chamados) {
      const total = chamados.length;
      const resolved = chamados.filter((chamado) => {
        const status = (chamado.status?.nome || "").toLowerCase();
        return status.includes("final") || status.includes("resolvido");
      });
      const openTickets = chamados.filter((chamado) => {
        const status = (chamado.status?.nome || "").toLowerCase();
        return !status.includes("final") && !status.includes("resolvido");
      });
      const urgent = chamados.filter((chamado) => (chamado.prioridade?.nome || "").toLowerCase().includes("alta"));

      const resolvedDurationsInMinutes = resolved
        .filter((chamado) => chamado.dataAbertura && chamado.dataFechamento)
        .map((chamado) => {
          const openedAt = new Date(chamado.dataAbertura).getTime();
          const closedAt = new Date(chamado.dataFechamento).getTime();
          return Math.max(0, (closedAt - openedAt) / 60000);
        });

      const avgResolutionMinutes = resolvedDurationsInMinutes.length
        ? resolvedDurationsInMinutes.reduce((sum, value) => sum + value, 0) / resolvedDurationsInMinutes.length
        : 0;

      const avgResponseMinutes = openTickets.length
        ? openTickets.reduce((sum, chamado) => {
            const openedAt = new Date(chamado.dataAbertura).getTime();
            const now = Date.now();
            return sum + Math.max(0, (now - openedAt) / 60000);
          }, 0) / openTickets.length
        : avgResolutionMinutes;

      const slaMet = resolved.filter((chamado) => {
        if (!chamado.dataAbertura || !chamado.dataFechamento) {
          return false;
        }

        const openedAt = new Date(chamado.dataAbertura).getTime();
        const closedAt = new Date(chamado.dataFechamento).getTime();
        const hoursToResolve = (closedAt - openedAt) / 3600000;
        return hoursToResolve <= SLA_HOURS_LIMIT;
      }).length;

      const slaRate = resolved.length ? Math.round((slaMet / resolved.length) * 100) : 0;
      const resolutionRate = total ? Math.round((resolved.length / total) * 100) : 0;
      const urgentRate = total ? Math.round((urgent.length / total) * 100) : 0;

      setText("metric-total", String(total));
      setText("metric-open", String(openTickets.length));
      setText("metric-avg-time", formatDurationFromMinutes(avgResolutionMinutes));
      setText("metric-sla", `${slaRate}%`);

      setText("resolution-rate-label", `${resolutionRate}%`);
      setWidth("resolution-rate-bar", resolutionRate);

      setText("urgent-rate-label", `${urgent.length} / ${total}`);
      setWidth("urgent-rate-bar", urgentRate);

      setText("response-time-label", formatDurationFromMinutes(avgResponseMinutes));
      setText("resolution-time-label", formatDurationFromMinutes(avgResolutionMinutes));
    }

    async function loadManagerDashboard() {
      const response = await app.apiFetch("/api/chamados");
      const data = await app.readResponse(response);

      if (!response.ok) {
        throw new Error(typeof data === "string" ? data : "Nao foi possivel carregar os indicadores.");
      }

      const chamados = Array.isArray(data) ? data : [];
      renderMetrics(chamados);
      setText("manager-message", `Indicadores carregados com ${chamados.length} chamados.`);
    }

    (async () => {
      const user = await app.requireAuth(["Admin", "Gestor"]);
      if (!user) {
        return;
      }

      app.attachLogout();

      try {
        await loadManagerDashboard();
      } catch (error) {
        setText("manager-message", error.message || "Erro ao carregar o dashboard do gestor.");
      }
    })();
  

