$(function () {    
    const STORAGE_KEY = 'historico-resultados';

    const lista = [];

    const $entrada = $('#entrada');
    const $itens = $('#itens');
    const $status = $('#status');
    const $btnSortear = $('#sortear');
    const $container = $('.container');
    const tabBgMap = {
        '#tab-sorteio': 'bg-sorteio',
        '#tab-historico': 'bg-historico',
        '#tab-checklist': 'bg-checklist'
    };
    
    const TAGS_PRE = [
        '@Sussuro Noturno',
        '@Exibicionista',
        '@Pomar Proibido',
        '@Sonhos Gêmeos',
        '@Florescer Secreto',
        '@Espada Ereta',
        '@Conexão Profunda',
        '@Êxtase Florescido'
    ];

    const tagsSelecionadasGlobais = new Set(); // seleção temporária para novo nome
    const checklist = []; // { nome, tags: [...] }
    let historico = {};    

    renderTagsDisponiveis();
    renderChecklist();
    carregarHistorico();
    renderHistorico();
    aplicarFundo('#tab-sorteio');

    function aplicarFundo(tabAlvo) {
        $container.removeClass('bg-sorteio bg-historico bg-checklist')
                  .addClass(tabBgMap[tabAlvo] || 'bg-sorteio');
    }

    function carregarHistorico() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            historico = raw ? JSON.parse(raw) : {};
        } catch (e) {
            historico = {};
        }
    }

    function salvarHistorico() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(historico, null, 2));
    }

    function limparHistorico() {
        historico = {};
        // remove do storage e atualiza a visão
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
            localStorage.setItem(STORAGE_KEY, '{}');
        }
        renderHistorico();
    }

    function agoraChaves() {
        const now = new Date();
        const data = now.toISOString().slice(0, 10); // YYYY-MM-DD
        const hora = now.toTimeString().slice(0, 8); // HH:MM:SS
        return { data, hora };
    }

    function registrarResultados(novosResultados) {
        const { data, hora } = agoraChaves();
        if (!historico.resultados) historico.resultados = {};
        if (!historico.resultados[data]) historico.resultados[data] = {};

        const entradaHora = {};
        novosResultados.forEach((valor, i) => {
            entradaHora[`Resultado ${i + 1}`] = valor;
        });

        historico.resultados[data][hora] = entradaHora;
        salvarHistorico();
        renderHistorico();
    }

    function renderHistorico() {
        const $hist = $('#historico-body');
        if (!historico.resultados || !Object.keys(historico.resultados).length) {
            $hist.html('<p class="hist-vazio">Nenhum sorteio ainda.</p>');
            return;
        }

        let html = '';
        Object.keys(historico.resultados).sort().reverse().forEach((data) => {
            html += `<div class="hist-dia"><h4>${data}</h4>`;
            const horas = historico.resultados[data];
            Object.keys(horas).sort().reverse().forEach((h) => {
                const res = horas[h];
                html += `<div class="hist-hora"><strong>${h}</strong><ul>`;
                Object.keys(res).forEach((key) => {
                    html += `<li>${key}: ${res[key]}</li>`;
                });
                html += `</ul></div>`;
            });
            html += `</div>`;
        });
        $hist.html(html);
    }

    function baixarHistorico() {
        const blob = new Blob([JSON.stringify(historico, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultados.json';
        a.click();
        URL.revokeObjectURL(url);
    }
    
    function renderTagsDisponiveis() {
        const $wrap = $('#chk-tags-container');
        const html = TAGS_PRE.map(tag => {
            const active = tagsSelecionadasGlobais.has(tag) ? 'active' : '';
            return `<button class="tag-chip ${active}" data-tag="${tag}">${tag}</button>`;
        }).join('');
        $wrap.html(html);
    }

    function renderChecklist() {
        const $lista = $('#chk-lista');
        if (!checklist.length) {
            $lista.html('<p class="chk-vazio">Nenhum nome adicionado.</p>');
            return;
        }
        const html = checklist.map((item, idx) => `
            <div class="chk-item" data-idx="${idx}">
                <div class="chk-item-header">
                    <div>
                        <span class="chk-remover" data-idx="${idx}">x</span>
                        <strong>${item.nome}</strong>
                    </div>
                    <div>
                        <button class="chk-tags-toggle" data-idx="${idx}" aria-expanded="${!!item.open}" aria-controls="chk-tags-${idx}">${item.open ? '▲' : '▼'}</button>
                    </div>
                </div>
                <ul class="chk-tags-selected ${item.open ? 'is-open' : 'is-closed'}" id="chk-tags-${idx}" data-idx="${idx}">
                    ${item.tags.length ? item.tags.map(t => `<li class="tag-chip active" data-tag="${t}" data-idx="${idx}">${t}</li>`).join('') : '<li><em>Sem tags</em></li>'}
                </ul>
            </div>
        `).join('');
        $lista.html(html);
    }

    function adicionarNomeChecklist(nome) {
        const tags = Array.from(tagsSelecionadasGlobais);
        checklist.push({ nome, tags, open: true }); // novo entra já aberto
        // mantém seleção atual no container de tags disponíveis
        renderTagsDisponiveis();
        renderChecklist();
    }

    function removerItem(entrada, lista){
        const valor = entrada.siblings('li').text().trim();
        entrada.closest('div').remove();
        const indice = lista.indexOf(valor);
        if (indice !== -1) {
            lista.splice(indice, 1);
        }
        console.log(lista)
    }

    function adicionarItem(entrada, lista, ul) {
        const valor = entrada.val().trim();
        if (!valor) return;
        if($.inArray(valor, lista) !== -1) {
            $status.text('Este nome já está no sorteio.');
            return;
        }
        lista.push(valor);
        ul.append(`
            <div class="flex-row remove-div">
                <span class="remove-item">x</span>
                <li>${valor}</li>
            <div>
            `);
        entrada.val('').focus();
    }
    
    $(document).on('click', '.tab-btn', function () {
        const alvo = $(this).data('tab');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-panel').removeClass('active');
        $(alvo).addClass('active');
        aplicarFundo(alvo);
    });

    $(document).on('click', '#exportar-historico', baixarHistorico);
    $(document).on('click', '#limpar-historico', limparHistorico);

    $(document).on('click', '.tab-btn', function () {
        const alvo = $(this).data('tab');
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        $('.tab-panel').removeClass('active');
        $(alvo).addClass('active');
    });

    // toggle tag seleção antes de adicionar nome (somente no container de tags disponíveis)
    $(document).on('click', '#chk-tags-container .tag-chip', function () {
        const tag = $(this).data('tag');
        if (tagsSelecionadasGlobais.has(tag)) {
            tagsSelecionadasGlobais.delete(tag);
        } else {
            tagsSelecionadasGlobais.add(tag);
        }
        renderTagsDisponiveis();
    });

    // adicionar nome
    $(document).on('click', '#chk-add', function () {
        const nome = $('#chk-nome').val().trim();
        if (!nome) return;
        adicionarNomeChecklist(nome);
        $('#chk-nome').val('').focus();
    });

    // Enter no input
    $('#chk-nome').on('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $('#chk-add').click();
        }
    });

    // remover item do checklist
    $(document).on('click', '.chk-remover', function () {
        const idx = parseInt($(this).data('idx'), 10);
        if (Number.isInteger(idx)) {
            checklist.splice(idx, 1);
            renderChecklist();
        }
    });

    // toggle tags dentro do item (opcional, permite alterar após adicionar)
    $(document).on('click', '.chk-tags-selected .tag-chip', function () {
        const idx = parseInt($(this).data('idx'), 10);
        const tag = $(this).data('tag');
        const item = checklist[idx];
        const wasOpen = item?.open;
        if (!Number.isInteger(idx) || !tag) return;
        if (!item) return;
        const pos = item.tags.indexOf(tag);
        if (pos === -1) item.tags.push(tag);
        else item.tags.splice(pos, 1);
        item.open = wasOpen; // preserva estado aberto
        renderChecklist();
    });

    // mostrar/ocultar tags de um item do checklist (hamburger/arrow)
    $(document).on('click', '.chk-tags-toggle', function () {
        const idx = $(this).data('idx');
        const $list = $(`#chk-tags-${idx}`);
        if (!$list.length) return;
        const isOpen = !$list.hasClass('is-closed');
        $list.toggleClass('is-closed', isOpen).toggleClass('is-open', !isOpen);
        $(this).attr('aria-expanded', !isOpen).text(isOpen ? '▼' : '▲');
        const item = checklist[idx];
        if (item) item.open = !isOpen; // persiste estado
    });

    $('#res-count').val(2);
    function adicionarSorteio(){
        let valor = parseInt($('#res-count').val(), 10) + 1;
        $('#res-count').val(valor);

        $('#resultado-body').append(`
            <div class="flex-row remove-div">
                <span class="remove-res">x</span>
                <p>
                    <strong>Resultado ${valor}:</strong>
                    <span class="span-resultado" id="resultado${valor}">—</span>
                </p>
            </div>
        `);
    }

    // reordena labels/ids dos resultados para manter numeração contínua
    function reindexResultados() {
        const $todos = $('.span-resultado');
        $todos.each(function (index) {
            const pos = index + 1;
            const $span = $(this);
            $span.attr('id', `resultado${pos}`);
            $span.closest('.flex-row').find('strong').text(`Resultado ${pos}:`);
        });
        $('#res-count').val($todos.length);
        lastValues = lastValues.slice(0, $todos.length);
    }

    $(document).on('click', '.toggle-collapsible', function(){
        const target = $(this).data('target');
        const $section = $(target);
        const collapsed = $section.toggleClass('is-collapsed').hasClass('is-collapsed');
        $(this).attr('aria-expanded', !collapsed);
    });

    $(document).on('click', '#add-sort', function(){
        adicionarSorteio();
    });

    $(document).on('click', '.remove-item', function(e, key){
       removerItem($(this), lista);
    });

    $('#add').on('click', function () {
        adicionarItem($entrada, lista, $itens);
    });
    
    // remover resultado individual
    $(document).on('click', '.remove-res', function () {
        const $todas = $('.span-resultado');
        if ($todas.length <= 1) {
            $status.text('Mantenha pelo menos um resultado.');
            return;
        }

        const $item = $(this).closest('div');
        const $span = $item.find('.span-resultado');
        const idx = $todas.index($span);

        if (idx > -1 && lastValues.length) {
            lastValues.splice(idx, 1);
        }

        $item.remove();
        reindexResultados();
    });

    // Permite enviar com Enter
    $entrada.on('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            adicionarItem($entrada, lista, $itens);
        }
    });

    let lastValues = [];
    $btnSortear.on('click', function () {
        const $resultados = $('.span-resultado');
        const totalResultados = $resultados.length || 1;

        if (!lista.length || lista.length < totalResultados) {
            $status.text('Adicione itens suficientes para a quantidade de resultados.');
            return;
        }

        $status.text('Sorteando...');
        $btnSortear.prop('disabled', true);

        setTimeout(() => {
            const disponiveis = [...lista];
            const novosResultados = [];

            for (let i = 0; i < totalResultados; i += 1) {
                // evita repetir o mesmo nome consecutivamente no mesmo slot
                let escolhaIndex = Math.floor(Math.random() * disponiveis.length);
                if (disponiveis.length > 1 && lastValues[i] === disponiveis[escolhaIndex]) {
                    escolhaIndex = (escolhaIndex + 1) % disponiveis.length;
                }

                const escolhido = disponiveis.splice(escolhaIndex, 1)[0];
                novosResultados.push(escolhido);
            }

            $resultados.each(function (index) {
                $(this).text(novosResultados[index] ?? '—');
            });

            // mantém os dois primeiros IDs legados atualizados, se existirem
            $('#resultado1').text(novosResultados[0] ?? '—');
            $('#resultado2').text(novosResultados[1] ?? '—');

            lastValues = novosResultados;
            registrarResultados(novosResultados);

            $status.text('Pronto!');
            $btnSortear.prop('disabled', false);
        }, 1500);
    });
});

